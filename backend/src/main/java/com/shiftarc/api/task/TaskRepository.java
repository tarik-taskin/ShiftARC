package com.shiftarc.api.task;

import java.sql.Date;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class TaskRepository {

    private final JdbcTemplate jdbcTemplate;

    TaskRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    List<TaskResponse> findAll(
        UUID workspaceId,
        TaskType type,
        TaskStatus status,
        UUID categoryId,
        String search,
        TaskSort sort
    ) {
        String order = switch (sort) {
            case DEADLINE -> "task.deadline ASC NULLS LAST, task.importance DESC, lower(task.title)";
            case CREATED -> "task.created_at DESC, lower(task.title)";
            case PRIORITY -> "task.importance DESC, task.deadline ASC NULLS LAST, lower(task.title)";
        };
        return jdbcTemplate.query(
            """
            SELECT task.* FROM shiftarc.task task
            WHERE task.workspace_id = ?
              AND (CAST(? AS varchar) IS NULL OR task.task_type = ?)
              AND (CAST(? AS varchar) IS NULL OR task.status = ?)
              AND (? = '' OR lower(task.title) LIKE lower(concat('%', ?, '%')))
              AND (CAST(? AS uuid) IS NULL OR EXISTS (
                  SELECT 1 FROM shiftarc.task_category link
                  WHERE link.task_id = task.id AND link.category_id = ?
              ))
            ORDER BY __ORDER__
            """.replace("__ORDER__", order),
            (resultSet, rowNumber) -> map(resultSet),
            workspaceId,
            type == null ? null : type.name(),
            type == null ? null : type.name(),
            status == null ? null : status.name(),
            status == null ? null : status.name(),
            search,
            search,
            categoryId,
            categoryId
        );
    }

    TaskResponse find(UUID workspaceId, UUID id) {
        List<TaskResponse> tasks = jdbcTemplate.query(
            "SELECT * FROM shiftarc.task WHERE workspace_id = ? AND id = ?",
            (resultSet, rowNumber) -> map(resultSet),
            workspaceId,
            id
        );
        if (tasks.isEmpty()) throw new TaskNotFoundException();
        return tasks.get(0);
    }

    TaskResponse create(UUID workspaceId, TaskWriteRequest request) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            """
            INSERT INTO shiftarc.task
                (id, workspace_id, task_type, title, description, importance,
                 total_required_minutes, deadline, weekly_target_minutes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            id,
            workspaceId,
            request.type().name(),
            request.title(),
            request.description(),
            request.importance(),
            request.totalRequiredMinutes(),
            request.deadline() == null ? null : Date.valueOf(request.deadline()),
            request.weeklyTargetMinutes()
        );
        replaceCategories(id, request.categoryIds());
        return find(workspaceId, id);
    }

    TaskResponse update(UUID workspaceId, UUID id, TaskWriteRequest request) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.task SET task_type = ?, title = ?, description = ?, importance = ?,
                total_required_minutes = ?, deadline = ?, weekly_target_minutes = ?,
                version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """,
            request.type().name(),
            request.title(),
            request.description(),
            request.importance(),
            request.totalRequiredMinutes(),
            request.deadline() == null ? null : Date.valueOf(request.deadline()),
            request.weeklyTargetMinutes(),
            workspaceId,
            id,
            request.version()
        );
        requireChanged(workspaceId, id, changed);
        replaceCategories(id, request.categoryIds());
        return find(workspaceId, id);
    }

    TaskResponse setStatus(UUID workspaceId, UUID id, TaskStatus status, long version) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.task SET status = ?,
                completed_at = CASE WHEN ? = 'COMPLETED' THEN current_timestamp ELSE NULL END,
                version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """,
            status.name(),
            status.name(),
            workspaceId,
            id,
            version
        );
        requireChanged(workspaceId, id, changed);
        return find(workspaceId, id);
    }

    boolean isActiveCategory(UUID workspaceId, UUID categoryId) {
        Integer count = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM shiftarc.category WHERE workspace_id = ? AND id = ? AND archived = false",
            Integer.class,
            workspaceId,
            categoryId
        );
        return count != null && count == 1;
    }

    private void replaceCategories(UUID taskId, List<UUID> categoryIds) {
        jdbcTemplate.update("DELETE FROM shiftarc.task_category WHERE task_id = ?", taskId);
        for (UUID categoryId : categoryIds.stream().distinct().toList()) {
            jdbcTemplate.update(
                "INSERT INTO shiftarc.task_category (task_id, category_id) VALUES (?, ?)",
                taskId,
                categoryId
            );
        }
    }

    private TaskResponse map(ResultSet resultSet) throws SQLException {
        UUID id = resultSet.getObject("id", UUID.class);
        Date deadline = resultSet.getDate("deadline");
        TaskType type = TaskType.valueOf(resultSet.getString("task_type"));
        Integer totalRequired = integer(resultSet, "total_required_minutes");
        Integer weeklyTarget = integer(resultSet, "weekly_target_minutes");
        int executed = executedMinutes(id, type);
        int target = type == TaskType.WORK_ITEM ? totalRequired : weeklyTarget;
        return new TaskResponse(
            id,
            type,
            resultSet.getString("title"),
            resultSet.getString("description"),
            resultSet.getShort("importance"),
            TaskStatus.valueOf(resultSet.getString("status")),
            totalRequired,
            deadline == null ? null : deadline.toLocalDate(),
            weeklyTarget,
            executed,
            Math.max(0, target - executed),
            categories(id),
            resultSet.getLong("version"),
            instant(resultSet, "completed_at"),
            instant(resultSet, "created_at"),
            instant(resultSet, "updated_at")
        );
    }

    private int executedMinutes(UUID taskId, TaskType type) {
        String period = type == TaskType.WORK_ITEM
            ? ""
            : """
              AND session.started_at >= (
                  date_trunc('week', current_timestamp AT TIME ZONE settings.timezone)
                  AT TIME ZONE settings.timezone
              )
              """;
        Integer value = jdbcTemplate.queryForObject(
            """
            SELECT COALESCE(floor(sum(extract(epoch FROM (session.ended_at - session.started_at))) / 60), 0)::int
            FROM shiftarc.task_execution_session session
            JOIN shiftarc.workspace_settings settings ON settings.workspace_id = session.workspace_id
            WHERE session.task_id = ? AND session.ended_at IS NOT NULL
            """ + period,
            Integer.class,
            taskId
        );
        return value == null ? 0 : value;
    }

    private List<TaskResponse.Category> categories(UUID taskId) {
        return jdbcTemplate.query(
            """
            SELECT category.id, category.name, category.color, category.icon, category.archived
            FROM shiftarc.task_category link
            JOIN shiftarc.category category ON category.id = link.category_id
            WHERE link.task_id = ? ORDER BY lower(category.name)
            """,
            (resultSet, rowNumber) -> new TaskResponse.Category(
                resultSet.getObject("id", UUID.class),
                resultSet.getString("name"),
                resultSet.getString("color"),
                resultSet.getString("icon"),
                resultSet.getBoolean("archived")
            ),
            taskId
        );
    }

    private Integer integer(ResultSet resultSet, String column) throws SQLException {
        int value = resultSet.getInt(column);
        return resultSet.wasNull() ? null : value;
    }

    private Instant instant(ResultSet resultSet, String column) throws SQLException {
        Timestamp value = resultSet.getTimestamp(column);
        return value == null ? null : value.toInstant();
    }

    private void requireChanged(UUID workspaceId, UUID id, int changed) {
        if (changed == 1) return;
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM shiftarc.task WHERE workspace_id = ? AND id = ?",
            Integer.class,
            workspaceId,
            id
        );
        if (exists == null || exists == 0) throw new TaskNotFoundException();
        throw new TaskConflictException("Task is stale; refresh before saving");
    }
}
