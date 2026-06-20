package com.shiftarc.api.pomodoro;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class PomodoroRepository {
    private final JdbcTemplate jdbc;
    PomodoroRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    PomodoroStateResponse state(UUID workspaceId) {
        PomodoroStateResponse.Settings settings = jdbc.queryForObject("""
            SELECT focus_minutes, short_break_minutes, long_break_minutes,
                   cycles_before_long_break, version
            FROM shiftarc.pomodoro_settings WHERE workspace_id = ?
            """, (rs, row) -> new PomodoroStateResponse.Settings(rs.getInt(1), rs.getInt(2),
            rs.getInt(3), rs.getInt(4), rs.getLong(5)), workspaceId);
        List<PomodoroStateResponse.Session> sessions = jdbc.query("""
            SELECT session.*, task.title AS task_title FROM shiftarc.pomodoro_session session
            LEFT JOIN shiftarc.task task ON task.id = session.task_id
            WHERE session.workspace_id = ? ORDER BY session.started_at DESC LIMIT 10
            """, (rs, row) -> map(rs), workspaceId);
        PomodoroStateResponse.Session active = sessions.stream().filter(s -> s.status().equals("ACTIVE")).findFirst().orElse(null);
        Integer cycles = jdbc.queryForObject("""
            SELECT count(*) FROM shiftarc.pomodoro_session session
            JOIN shiftarc.workspace_settings settings ON settings.workspace_id = session.workspace_id
            WHERE session.workspace_id = ? AND session.phase = 'FOCUS' AND session.status = 'COMPLETED'
              AND session.ended_at >= (current_date AT TIME ZONE settings.timezone)
            """, Integer.class, workspaceId);
        return new PomodoroStateResponse(settings, active, sessions, cycles == null ? 0 : cycles);
    }

    void start(UUID workspaceId, PomodoroPhase phase, UUID taskId, int duration) {
        jdbc.update("""
            INSERT INTO shiftarc.pomodoro_session
                (workspace_id, task_id, phase, duration_minutes, planned_end_at)
            VALUES (?, ?, ?, ?, current_timestamp + make_interval(mins => ?))
            """, workspaceId, taskId, phase.name(), duration, duration);
    }

    void finish(UUID workspaceId, UUID id, long version, String status) {
        int changed = jdbc.update("""
            UPDATE shiftarc.pomodoro_session SET status = ?, ended_at = current_timestamp,
                version = version + 1 WHERE workspace_id = ? AND id = ?
                AND status = 'ACTIVE' AND version = ?
            """, status, workspaceId, id, version);
        if (changed == 1) return;
        Integer count = jdbc.queryForObject("SELECT count(*) FROM shiftarc.pomodoro_session WHERE workspace_id = ? AND id = ?",
            Integer.class, workspaceId, id);
        if (count == null || count == 0) throw new PomodoroNotFoundException();
        throw new PomodoroConflictException("Pomodoro session is no longer active or its version changed");
    }

    void updateSettings(UUID workspaceId, PomodoroRequests.Settings request) {
        int changed = jdbc.update("""
            UPDATE shiftarc.pomodoro_settings SET focus_minutes = ?, short_break_minutes = ?,
                long_break_minutes = ?, cycles_before_long_break = ?, version = version + 1,
                updated_at = current_timestamp WHERE workspace_id = ? AND version = ?
            """, request.focusMinutes(), request.shortBreakMinutes(), request.longBreakMinutes(),
            request.cyclesBeforeLongBreak(), workspaceId, request.version());
        if (changed == 0) throw new PomodoroConflictException("Pomodoro settings changed by another request");
    }

    boolean activeTask(UUID workspaceId, UUID taskId) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM shiftarc.task WHERE workspace_id = ? AND id = ? AND status = 'ACTIVE'",
            Integer.class, workspaceId, taskId);
        return count != null && count == 1;
    }

    private PomodoroStateResponse.Session map(ResultSet rs) throws SQLException {
        return new PomodoroStateResponse.Session(rs.getObject("id", UUID.class),
            PomodoroPhase.valueOf(rs.getString("phase")), rs.getString("status"),
            rs.getInt("duration_minutes"), rs.getObject("task_id", UUID.class), rs.getString("task_title"),
            instant(rs, "started_at"), instant(rs, "planned_end_at"), instant(rs, "ended_at"), rs.getLong("version"));
    }
    private Instant instant(ResultSet rs, String name) throws SQLException {
        Timestamp value = rs.getTimestamp(name); return value == null ? null : value.toInstant();
    }
}
