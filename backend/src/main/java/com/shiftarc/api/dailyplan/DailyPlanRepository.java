package com.shiftarc.api.dailyplan;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class DailyPlanRepository {

    private final JdbcTemplate jdbcTemplate;

    DailyPlanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    String timezone(UUID workspaceId) {
        return jdbcTemplate.queryForObject(
            "SELECT timezone FROM shiftarc.workspace_settings WHERE workspace_id = ?",
            String.class,
            workspaceId
        );
    }

    DayTypeSource assignedDayType(UUID workspaceId, int dayOfWeek) {
        List<DayTypeSource> sources = jdbcTemplate.query(
            """
            SELECT day_type.id, day_type.name
            FROM shiftarc.weekly_day_assignment assignment
            JOIN shiftarc.day_type day_type ON day_type.id = assignment.day_type_id
            WHERE assignment.workspace_id = ? AND assignment.day_of_week = ?
            """,
            (resultSet, rowNumber) -> new DayTypeSource(
                resultSet.getObject("id", UUID.class), resultSet.getString("name")
            ),
            workspaceId,
            dayOfWeek
        );
        if (sources.isEmpty()) {
            throw new DailyPlanUnavailableException("No day type is assigned to this weekday");
        }
        return sources.get(0);
    }

    List<SourceBlock> sourceBlocks(UUID dayTypeId) {
        return jdbcTemplate.query(
            """
            SELECT block.id, block.name, block.start_minute, block.end_minute, block.position,
                   link.category_id
            FROM shiftarc.day_type_block block
            LEFT JOIN shiftarc.day_type_block_category link ON link.day_type_block_id = block.id
            WHERE block.day_type_id = ?
            ORDER BY block.position, link.category_id
            """,
            (org.springframework.jdbc.core.ResultSetExtractor<List<SourceBlock>>) this::groupBlocks,
            dayTypeId
        );
    }

    List<PlanningTask> activeTasks(UUID workspaceId) {
        return jdbcTemplate.query(
            """
            SELECT task.id, task.task_type, task.title, task.importance,
                   task.total_required_minutes, task.deadline, task.weekly_target_minutes,
                   COALESCE((
                       SELECT floor(sum(extract(epoch FROM (session.ended_at - session.started_at))) / 60)::int
                       FROM shiftarc.task_execution_session session
                       WHERE session.task_id = task.id AND session.ended_at IS NOT NULL
                   ), 0) AS executed_total_minutes,
                   COALESCE((
                       SELECT floor(sum(extract(epoch FROM (session.ended_at - session.started_at))) / 60)::int
                       FROM shiftarc.task_execution_session session
                       JOIN shiftarc.workspace_settings settings ON settings.workspace_id = session.workspace_id
                       WHERE session.task_id = task.id AND session.ended_at IS NOT NULL
                         AND session.started_at >= (
                             date_trunc('week', current_timestamp AT TIME ZONE settings.timezone)
                             AT TIME ZONE settings.timezone
                         )
                   ), 0) AS executed_week_minutes,
                   link.category_id
            FROM shiftarc.task task
            LEFT JOIN shiftarc.task_category link ON link.task_id = task.id
            WHERE task.workspace_id = ? AND task.status = 'ACTIVE'
            ORDER BY task.importance DESC, task.deadline ASC NULLS LAST, task.created_at, link.category_id
            """,
            (org.springframework.jdbc.core.ResultSetExtractor<List<PlanningTask>>) this::groupTasks,
            workspaceId
        );
    }

    DailyPlanResponse find(UUID workspaceId, LocalDate date) {
        List<PlanHeader> headers = jdbcTemplate.query(
            "SELECT * FROM shiftarc.daily_plan WHERE workspace_id = ? AND plan_date = ?",
            (resultSet, rowNumber) -> new PlanHeader(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("source_day_type_id", UUID.class),
                resultSet.getString("source_day_type_name"),
                resultSet.getString("timezone"),
                resultSet.getString("status"),
                resultSet.getLong("version"),
                resultSet.getTimestamp("generated_at").toInstant()
            ),
            workspaceId,
            Date.valueOf(date)
        );
        if (headers.isEmpty()) return null;
        PlanHeader header = headers.get(0);
        return new DailyPlanResponse(
            header.id(), date, header.timezone(), header.dayTypeId(), header.dayTypeName(),
            header.status(), header.version(), header.generatedAt(), planBlocks(header.id()), warnings(header.id())
        );
    }

    void createPlan(
        UUID planId,
        UUID workspaceId,
        LocalDate date,
        String timezone,
        DayTypeSource source,
        List<PlannedBlock> blocks,
        List<PlannedWarning> warnings
    ) {
        jdbcTemplate.update(
            """
            INSERT INTO shiftarc.daily_plan
                (id, workspace_id, plan_date, source_day_type_id, source_day_type_name, timezone)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            planId, workspaceId, Date.valueOf(date), source.id(), source.name(), timezone
        );
        insertStructure(planId, blocks, warnings);
    }

    void replacePlan(
        UUID planId,
        UUID workspaceId,
        long version,
        String timezone,
        DayTypeSource source,
        List<PlannedBlock> blocks,
        List<PlannedWarning> warnings
    ) {
        Integer executionCount = jdbcTemplate.queryForObject(
            """
            SELECT count(*) FROM shiftarc.task_execution_session session
            JOIN shiftarc.daily_plan_item item ON item.id = session.daily_plan_item_id
            JOIN shiftarc.daily_plan_block block ON block.id = item.daily_plan_block_id
            WHERE block.daily_plan_id = ?
            """,
            Integer.class,
            planId
        );
        if (executionCount != null && executionCount > 0) {
            throw new DailyPlanConflictException(
                "A daily plan with execution history cannot be regenerated"
            );
        }
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.daily_plan SET source_day_type_id = ?, source_day_type_name = ?,
                timezone = ?, generated_at = current_timestamp, version = version + 1,
                updated_at = current_timestamp
            WHERE id = ? AND workspace_id = ? AND status = 'ACTIVE' AND version = ?
            """,
            source.id(), source.name(), timezone, planId, workspaceId, version
        );
        if (changed != 1) throw new DailyPlanConflictException("Daily plan changed; refresh before regenerating");
        jdbcTemplate.update("DELETE FROM shiftarc.daily_plan_warning WHERE daily_plan_id = ?", planId);
        jdbcTemplate.update("DELETE FROM shiftarc.daily_plan_block WHERE daily_plan_id = ?", planId);
        insertStructure(planId, blocks, warnings);
    }

    private void insertStructure(UUID planId, List<PlannedBlock> blocks, List<PlannedWarning> warnings) {
        for (int position = 0; position < blocks.size(); position++) {
            PlannedBlock block = blocks.get(position);
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.daily_plan_block
                    (id, daily_plan_id, source_day_type_block_id, name, start_minute, end_minute, position)
                VALUES (?, ?, ?, ?, ?, ?, ?)
                """,
                block.id(), planId, block.sourceId(), block.name(), block.startMinute(), block.endMinute(), position
            );
            for (int itemPosition = 0; itemPosition < block.items().size(); itemPosition++) {
                PlannedItem item = block.items().get(itemPosition);
                jdbcTemplate.update(
                    """
                    INSERT INTO shiftarc.daily_plan_item
                        (id, daily_plan_block_id, task_id, task_title,
                         planned_start_minute, planned_end_minute, position)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                    """,
                    item.id(), block.id(), item.taskId(), item.taskTitle(),
                    item.startMinute(), item.endMinute(), itemPosition
                );
            }
        }
        for (PlannedWarning warning : warnings) {
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.daily_plan_warning
                    (daily_plan_id, task_id, reason_code, unallocated_minutes, detail)
                VALUES (?, ?, ?, ?, ?)
                """,
                planId, warning.taskId(), warning.reasonCode(), warning.minutes(), warning.detail()
            );
        }
    }

    private List<DailyPlanResponse.Block> planBlocks(UUID planId) {
        List<BlockHeader> blocks = jdbcTemplate.query(
            "SELECT id, name, start_minute, end_minute FROM shiftarc.daily_plan_block WHERE daily_plan_id = ? ORDER BY position",
            (resultSet, rowNumber) -> new BlockHeader(
                resultSet.getObject("id", UUID.class), resultSet.getString("name"),
                resultSet.getInt("start_minute"), resultSet.getInt("end_minute")
            ),
            planId
        );
        return blocks.stream().map(block -> new DailyPlanResponse.Block(
            block.id(), block.name(), block.start(), block.end(), planItems(block.id())
        )).toList();
    }

    private List<DailyPlanResponse.Item> planItems(UUID blockId) {
        return jdbcTemplate.query(
            """
            SELECT item.*, task.task_type, task.importance
            FROM shiftarc.daily_plan_item item
            LEFT JOIN shiftarc.task task ON task.id = item.task_id
            WHERE item.daily_plan_block_id = ? ORDER BY item.position
            """,
            (resultSet, rowNumber) -> new DailyPlanResponse.Item(
                resultSet.getObject("id", UUID.class), resultSet.getObject("task_id", UUID.class),
                resultSet.getString("task_title"), resultSet.getString("task_type"),
                resultSet.getInt("importance"), resultSet.getInt("planned_start_minute"),
                resultSet.getInt("planned_end_minute"), resultSet.getString("status")
            ),
            blockId
        );
    }

    private List<DailyPlanResponse.Warning> warnings(UUID planId) {
        return jdbcTemplate.query(
            "SELECT task_id, reason_code, unallocated_minutes, detail FROM shiftarc.daily_plan_warning WHERE daily_plan_id = ? ORDER BY created_at",
            (resultSet, rowNumber) -> new DailyPlanResponse.Warning(
                resultSet.getObject("task_id", UUID.class), resultSet.getString("reason_code"),
                resultSet.getInt("unallocated_minutes"), resultSet.getString("detail")
            ),
            planId
        );
    }

    private List<SourceBlock> groupBlocks(ResultSet resultSet) throws SQLException {
        List<SourceBlock> blocks = new ArrayList<>();
        UUID id = null; String name = null; int start = 0; int end = 0;
        Set<UUID> categories = new LinkedHashSet<>();
        while (resultSet.next()) {
            UUID nextId = resultSet.getObject("id", UUID.class);
            if (id != null && !id.equals(nextId)) {
                blocks.add(new SourceBlock(id, name, start, end, Set.copyOf(categories)));
                categories.clear();
            }
            id = nextId; name = resultSet.getString("name"); start = resultSet.getInt("start_minute"); end = resultSet.getInt("end_minute");
            UUID category = resultSet.getObject("category_id", UUID.class); if (category != null) categories.add(category);
        }
        if (id != null) blocks.add(new SourceBlock(id, name, start, end, Set.copyOf(categories)));
        return blocks;
    }

    private List<PlanningTask> groupTasks(ResultSet resultSet) throws SQLException {
        List<PlanningTask> tasks = new ArrayList<>();
        UUID id = null; String type = null; String title = null; int importance = 0; Integer total = null; LocalDate deadline = null; Integer weekly = null; int executedTotal = 0; int executedWeek = 0;
        Set<UUID> categories = new LinkedHashSet<>();
        while (resultSet.next()) {
            UUID nextId = resultSet.getObject("id", UUID.class);
            if (id != null && !id.equals(nextId)) {
                tasks.add(new PlanningTask(id, type, title, importance, total, deadline, weekly, executedTotal, executedWeek, Set.copyOf(categories)));
                categories.clear();
            }
            id = nextId; type = resultSet.getString("task_type"); title = resultSet.getString("title"); importance = resultSet.getInt("importance");
            total = nullableInt(resultSet, "total_required_minutes"); Date date = resultSet.getDate("deadline"); deadline = date == null ? null : date.toLocalDate();
            weekly = nullableInt(resultSet, "weekly_target_minutes"); executedTotal = resultSet.getInt("executed_total_minutes"); executedWeek = resultSet.getInt("executed_week_minutes"); UUID category = resultSet.getObject("category_id", UUID.class); if (category != null) categories.add(category);
        }
        if (id != null) tasks.add(new PlanningTask(id, type, title, importance, total, deadline, weekly, executedTotal, executedWeek, Set.copyOf(categories)));
        return tasks;
    }

    private Integer nullableInt(ResultSet resultSet, String column) throws SQLException { int value = resultSet.getInt(column); return resultSet.wasNull() ? null : value; }

    record DayTypeSource(UUID id, String name) {}
    record SourceBlock(UUID id, String name, int startMinute, int endMinute, Set<UUID> categoryIds) {}
    record PlanningTask(UUID id, String type, String title, int importance, Integer totalMinutes, LocalDate deadline, Integer weeklyMinutes, int executedTotalMinutes, int executedWeekMinutes, Set<UUID> categoryIds) {}
    record PlannedBlock(UUID id, UUID sourceId, String name, int startMinute, int endMinute, List<PlannedItem> items) {}
    record PlannedItem(UUID id, UUID taskId, String taskTitle, int startMinute, int endMinute) {}
    record PlannedWarning(UUID taskId, String reasonCode, int minutes, String detail) {}
    private record PlanHeader(UUID id, UUID dayTypeId, String dayTypeName, String timezone, String status, long version, Instant generatedAt) {}
    private record BlockHeader(UUID id, String name, int start, int end) {}
}
