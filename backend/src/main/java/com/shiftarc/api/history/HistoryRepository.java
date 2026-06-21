package com.shiftarc.api.history;

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
class HistoryRepository {
    private final JdbcTemplate jdbc;
    HistoryRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    List<HistoryResponse.Day> days(UUID workspaceId, LocalDate from, LocalDate to) {
        return jdbc.query("""
            SELECT plan.plan_date, plan.id, plan.source_day_type_name, plan.status,
                   COALESCE(sum(item.planned_end_minute - item.planned_start_minute), 0)::int AS planned_minutes,
                   COALESCE(executions.executed_minutes, 0) AS executed_minutes,
                   count(item.id) FILTER (WHERE item.status = 'COMPLETED')::int AS completed_items,
                   count(item.id)::int AS total_items,
                   COALESCE(executions.session_count, 0) AS session_count
            FROM shiftarc.daily_plan plan
            LEFT JOIN shiftarc.daily_plan_block block ON block.daily_plan_id = plan.id
            LEFT JOIN shiftarc.daily_plan_item item ON item.daily_plan_block_id = block.id
            LEFT JOIN LATERAL (
                SELECT floor(sum(extract(epoch FROM (session.ended_at - session.started_at))) / 60)::int AS executed_minutes,
                       count(*)::int AS session_count
                FROM shiftarc.task_execution_session session
                JOIN shiftarc.daily_plan_item execution_item ON execution_item.id = session.daily_plan_item_id
                JOIN shiftarc.daily_plan_block execution_block ON execution_block.id = execution_item.daily_plan_block_id
                WHERE execution_block.daily_plan_id = plan.id AND session.ended_at IS NOT NULL
            ) executions ON true
            WHERE plan.workspace_id = ? AND plan.plan_date BETWEEN ? AND ?
            GROUP BY plan.id, executions.executed_minutes, executions.session_count
            ORDER BY plan.plan_date
            """, (rs, row) -> day(rs), workspaceId, Date.valueOf(from), Date.valueOf(to));
    }

    List<HistoryResponse.Session> sessions(UUID workspaceId, LocalDate date, String timezone) {
        return jdbc.query("""
            SELECT session.id, session.task_id, task.title, session.started_at, session.ended_at,
                   COALESCE(extract(epoch FROM (session.ended_at - session.started_at)), 0)::int AS duration_seconds
            FROM shiftarc.task_execution_session session
            JOIN shiftarc.task task ON task.id = session.task_id
            WHERE session.workspace_id = ?
              AND (session.started_at AT TIME ZONE ?)::date = ?
            ORDER BY session.started_at
            """, (rs, row) -> new HistoryResponse.Session(rs.getObject("id", UUID.class),
            rs.getObject("task_id", UUID.class), rs.getString("title"), instant(rs, "started_at"),
            instant(rs, "ended_at"), rs.getInt("duration_seconds")), workspaceId, timezone, Date.valueOf(date));
    }

    List<HistoryResponse.Event> events(UUID workspaceId, LocalDate date, String timezone) {
        return jdbc.query("""
            SELECT event.id, event.session_id, event.event_type, event.occurred_at,
                   event.payload::text AS payload
            FROM shiftarc.task_execution_event event
            WHERE event.workspace_id = ? AND (event.occurred_at AT TIME ZONE ?)::date = ?
            ORDER BY event.occurred_at, event.created_at
            """, (rs, row) -> new HistoryResponse.Event(rs.getObject("id", UUID.class),
            rs.getObject("session_id", UUID.class), rs.getString("event_type"),
            instant(rs, "occurred_at"), rs.getString("payload")), workspaceId, timezone, Date.valueOf(date));
    }

    private HistoryResponse.Day day(ResultSet rs) throws SQLException {
        return new HistoryResponse.Day(rs.getDate("plan_date").toLocalDate(), rs.getObject("id", UUID.class),
            rs.getString("source_day_type_name"), rs.getString("status"), rs.getInt("planned_minutes"),
            rs.getInt("executed_minutes"), rs.getInt("completed_items"), rs.getInt("total_items"),
            rs.getInt("session_count"));
    }
    private Instant instant(ResultSet rs, String name) throws SQLException {
        Timestamp value = rs.getTimestamp(name); return value == null ? null : value.toInstant();
    }
}
