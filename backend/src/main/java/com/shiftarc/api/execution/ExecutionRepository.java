package com.shiftarc.api.execution;

import java.sql.Date;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class ExecutionRepository {

    private final JdbcTemplate jdbcTemplate;
    ExecutionRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    ExecutionStateResponse state(UUID workspaceId, LocalDate date, String timezone, Instant now) {
        List<ExecutionStateResponse.Session> sessions = jdbcTemplate.query(
            """
            SELECT session.id, session.task_id, task.title, session.daily_plan_item_id,
                   session.started_at, session.ended_at, session.version
            FROM shiftarc.task_execution_session session
            JOIN shiftarc.task task ON task.id = session.task_id
            WHERE session.workspace_id = ?
              AND (session.started_at AT TIME ZONE ?)::date = ?
            ORDER BY session.started_at DESC
            """,
            (resultSet, rowNumber) -> {
                Instant started = resultSet.getTimestamp("started_at").toInstant();
                Timestamp endedValue = resultSet.getTimestamp("ended_at");
                Instant ended = endedValue == null ? null : endedValue.toInstant();
                long duration = Math.max(0, java.time.Duration.between(started, ended == null ? now : ended).toSeconds());
                return new ExecutionStateResponse.Session(
                    resultSet.getObject("id", UUID.class),
                    resultSet.getObject("task_id", UUID.class),
                    resultSet.getString("title"),
                    resultSet.getObject("daily_plan_item_id", UUID.class),
                    started,
                    ended,
                    resultSet.getLong("version"),
                    duration
                );
            },
            workspaceId,
            timezone,
            Date.valueOf(date)
        );
        ExecutionStateResponse.Session active = sessions.stream()
            .filter(session -> session.endedAt() == null)
            .findFirst()
            .orElse(null);
        return new ExecutionStateResponse(date, timezone, active, sessions);
    }

    ItemTarget requireStartableTodayItem(UUID workspaceId, UUID itemId, LocalDate date) {
        List<ItemTarget> items = jdbcTemplate.query(
            """
            SELECT item.id, item.task_id, item.task_title, item.status
            FROM shiftarc.daily_plan_item item
            JOIN shiftarc.daily_plan_block block ON block.id = item.daily_plan_block_id
            JOIN shiftarc.daily_plan plan ON plan.id = block.daily_plan_id
            JOIN shiftarc.task task ON task.id = item.task_id
            WHERE item.id = ? AND plan.workspace_id = ? AND plan.plan_date = ?
              AND plan.status = 'ACTIVE' AND task.status = 'ACTIVE'
            """,
            (resultSet, rowNumber) -> new ItemTarget(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("task_id", UUID.class),
                resultSet.getString("task_title"),
                resultSet.getString("status")
            ),
            itemId,
            workspaceId,
            Date.valueOf(date)
        );
        if (items.isEmpty()) throw new ExecutionNotFoundException("The daily plan item is not startable today");
        ItemTarget item = items.get(0);
        if (!item.status().equals("PLANNED")) {
            throw new ExecutionConflictException("Only planned items can be started");
        }
        return item;
    }

    UUID start(UUID workspaceId, ItemTarget item, Instant startedAt) {
        UUID sessionId = UUID.randomUUID();
        try {
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.task_execution_session
                    (id, workspace_id, task_id, daily_plan_item_id, started_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                sessionId, workspaceId, item.taskId(), item.id(), Timestamp.from(startedAt)
            );
        } catch (DataIntegrityViolationException exception) {
            throw new ExecutionConflictException("Another task execution session is already active");
        }
        int itemChanged = jdbcTemplate.update(
            """
            UPDATE shiftarc.daily_plan_item
            SET status = 'ACTIVE', version = version + 1, updated_at = current_timestamp
            WHERE id = ? AND status = 'PLANNED'
            """,
            item.id()
        );
        if (itemChanged != 1) throw new ExecutionConflictException("The plan item changed before it could start");
        event(workspaceId, sessionId, "STARTED", startedAt, "{}");
        return sessionId;
    }

    SessionTarget requireActiveSession(UUID workspaceId, UUID sessionId, long version) {
        List<SessionTarget> sessions = jdbcTemplate.query(
            """
            SELECT id, task_id, daily_plan_item_id, started_at, version
            FROM shiftarc.task_execution_session
            WHERE workspace_id = ? AND id = ? AND ended_at IS NULL
            """,
            (resultSet, rowNumber) -> new SessionTarget(
                resultSet.getObject("id", UUID.class),
                resultSet.getObject("task_id", UUID.class),
                resultSet.getObject("daily_plan_item_id", UUID.class),
                resultSet.getTimestamp("started_at").toInstant(),
                resultSet.getLong("version")
            ),
            workspaceId,
            sessionId
        );
        if (sessions.isEmpty()) throw new ExecutionNotFoundException("The active execution session was not found");
        SessionTarget session = sessions.get(0);
        if (session.version() != version) throw new ExecutionConflictException("Execution session is stale; refresh before continuing");
        return session;
    }

    void finish(UUID workspaceId, SessionTarget session, Instant endedAt, String eventType, UUID nextItemId) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.task_execution_session
            SET ended_at = ?, version = version + 1, updated_at = current_timestamp
            WHERE id = ? AND workspace_id = ? AND ended_at IS NULL AND version = ?
            """,
            Timestamp.from(endedAt), session.id(), workspaceId, session.version()
        );
        if (changed != 1) throw new ExecutionConflictException("Execution session changed before it could finish");
        if (session.itemId() != null) {
            jdbcTemplate.update(
                """
                UPDATE shiftarc.daily_plan_item
                SET status = 'COMPLETED', version = version + 1, updated_at = current_timestamp
                WHERE id = ? AND status = 'ACTIVE'
                """,
                session.itemId()
            );
        }
        String payload = nextItemId == null
            ? "{}"
            : "{\"nextDailyPlanItemId\":\"" + nextItemId + "\"}";
        event(workspaceId, session.id(), eventType, endedAt, payload);
    }

    private void event(UUID workspaceId, UUID sessionId, String type, Instant occurredAt, String payload) {
        jdbcTemplate.update(
            """
            INSERT INTO shiftarc.task_execution_event
                (id, workspace_id, session_id, event_type, occurred_at, payload)
            VALUES (?, ?, ?, ?, ?, CAST(? AS jsonb))
            """,
            UUID.randomUUID(), workspaceId, sessionId, type, Timestamp.from(occurredAt), payload
        );
    }

    record ItemTarget(UUID id, UUID taskId, String taskTitle, String status) {}
    record SessionTarget(UUID id, UUID taskId, UUID itemId, Instant startedAt, long version) {}
}
