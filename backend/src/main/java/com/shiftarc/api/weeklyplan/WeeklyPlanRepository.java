package com.shiftarc.api.weeklyplan;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class WeeklyPlanRepository {

    private final JdbcTemplate jdbcTemplate;

    WeeklyPlanRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    WeeklyPlanResponse find(UUID workspaceId) {
        Long version = jdbcTemplate.queryForObject(
            "SELECT version FROM shiftarc.workspace_settings WHERE workspace_id = ?",
            Long.class,
            workspaceId
        );
        List<AssignedDay> assignedDays = jdbcTemplate.query(
            """
            SELECT assignment.day_of_week, day_type.id, day_type.name, day_type.color,
                   day_type.archived, count(block.id) AS block_count
            FROM shiftarc.weekly_day_assignment assignment
            JOIN shiftarc.day_type day_type ON day_type.id = assignment.day_type_id
            LEFT JOIN shiftarc.day_type_block block ON block.day_type_id = day_type.id
            WHERE assignment.workspace_id = ?
            GROUP BY assignment.day_of_week, day_type.id
            ORDER BY assignment.day_of_week
            """,
            (resultSet, rowNumber) -> new AssignedDay(
                resultSet.getShort("day_of_week"),
                new WeeklyPlanResponse.DayType(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getString("name"),
                    resultSet.getString("color"),
                    resultSet.getBoolean("archived"),
                    resultSet.getInt("block_count")
                )
            ),
            workspaceId
        );
        Map<Short, AssignedDay> assignments = assignedDays.stream()
            .collect(Collectors.toMap(AssignedDay::dayOfWeek, Function.identity()));
        List<WeeklyPlanResponse.Day> days = new ArrayList<>();
        for (short day = 1; day <= 7; day++) {
            AssignedDay assigned = assignments.get(day);
            days.add(new WeeklyPlanResponse.Day(day, assigned == null ? null : assigned.dayType()));
        }
        return new WeeklyPlanResponse(version == null ? 0 : version, assignedDays.size() == 7, days);
    }

    WeeklyPlanResponse replace(
        UUID workspaceId,
        long version,
        List<WeeklyPlanUpdateRequest.Assignment> assignments
    ) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.workspace_settings
            SET version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND version = ?
            """,
            workspaceId,
            version
        );
        if (changed != 1) {
            throw new WeeklyPlanConflictException(
                "Workspace settings changed; refresh the weekly plan before saving"
            );
        }
        jdbcTemplate.update(
            "DELETE FROM shiftarc.weekly_day_assignment WHERE workspace_id = ?",
            workspaceId
        );
        for (WeeklyPlanUpdateRequest.Assignment assignment : assignments) {
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.weekly_day_assignment
                    (workspace_id, day_of_week, day_type_id)
                VALUES (?, ?, ?)
                """,
                workspaceId,
                assignment.dayOfWeek(),
                assignment.dayTypeId()
            );
        }
        return find(workspaceId);
    }

    boolean isActiveDayType(UUID workspaceId, UUID dayTypeId) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT count(*) FROM shiftarc.day_type
            WHERE workspace_id = ? AND id = ? AND archived = false
            """,
            Integer.class,
            workspaceId,
            dayTypeId
        );
        return count != null && count == 1;
    }

    private record AssignedDay(short dayOfWeek, WeeklyPlanResponse.DayType dayType) {
    }
}
