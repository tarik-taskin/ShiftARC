package com.shiftarc.api.trigger;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class TriggerRepository {
    private final JdbcTemplate jdbc;

    TriggerRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    List<TriggerResponse> list(UUID workspaceId, boolean includeArchived) {
        return jdbc.query("""
            SELECT * FROM shiftarc.trigger_rule WHERE workspace_id = ?
              AND (? OR status <> 'ARCHIVED')
            ORDER BY CASE WHEN next_due_at <= current_timestamp THEN 0 ELSE 1 END,
                     importance DESC, next_due_at NULLS LAST, lower(title)
            """, (rs, row) -> map(rs), workspaceId, includeArchived);
    }

    TriggerResponse find(UUID workspaceId, UUID id) {
        List<TriggerResponse> values = jdbc.query(
            "SELECT * FROM shiftarc.trigger_rule WHERE workspace_id = ? AND id = ?",
            (rs, row) -> map(rs), workspaceId, id);
        if (values.isEmpty()) throw new TriggerNotFoundException();
        return values.get(0);
    }

    TriggerResponse create(UUID workspaceId, TriggerWriteRequest request) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
            INSERT INTO shiftarc.trigger_rule
                (id, workspace_id, trigger_type, schedule_type, title, description,
                 importance, duration_minutes, interval_minutes, occurrence_target, next_due_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CASE WHEN ? = 'INTERVAL' THEN current_timestamp ELSE NULL END)
            """, id, workspaceId, request.type().name(), request.scheduleType().name(),
            request.title(), request.description(), request.importance(), request.durationMinutes(),
            request.intervalMinutes(), request.occurrenceTarget(), request.scheduleType().name());
        replaceCategories(id, request.categoryIds());
        replaceDayTypes(id, request.dayTypeIds());
        return find(workspaceId, id);
    }

    TriggerResponse update(UUID workspaceId, UUID id, TriggerWriteRequest request) {
        int changed = jdbc.update("""
            UPDATE shiftarc.trigger_rule SET trigger_type = ?, schedule_type = ?, title = ?,
                description = ?, importance = ?, duration_minutes = ?, interval_minutes = ?,
                occurrence_target = ?, next_due_at = CASE
                    WHEN ? = 'AFTER_CATEGORY' THEN NULL
                    WHEN next_due_at IS NULL THEN current_timestamp ELSE next_due_at END,
                version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """, request.type().name(), request.scheduleType().name(), request.title(), request.description(),
            request.importance(), request.durationMinutes(), request.intervalMinutes(), request.occurrenceTarget(),
            request.scheduleType().name(), workspaceId, id, request.version());
        requireChanged(workspaceId, id, changed);
        replaceCategories(id, request.categoryIds());
        replaceDayTypes(id, request.dayTypeIds());
        return find(workspaceId, id);
    }

    TriggerResponse complete(UUID workspaceId, UUID id, long version) {
        TriggerResponse current = find(workspaceId, id);
        if (current.status() != TriggerStatus.ACTIVE) throw new TriggerConflictException("Only active triggers can be completed");
        jdbc.update("""
            INSERT INTO shiftarc.trigger_occurrence
                (trigger_rule_id, workspace_id, due_at, duration_minutes)
            VALUES (?, ?, ?, ?)
            """, id, workspaceId, timestamp(current.nextDueAt()), current.durationMinutes());
        int nextCount = current.completedOccurrences() + 1;
        boolean finished = current.type() == TriggerType.WORK_ITEM && nextCount >= current.occurrenceTarget();
        int changed = jdbc.update("""
            UPDATE shiftarc.trigger_rule SET completed_occurrences = ?, status = ?,
                next_due_at = CASE
                    WHEN ? THEN NULL
                    WHEN schedule_type = 'INTERVAL' THEN current_timestamp + make_interval(mins => interval_minutes)
                    ELSE NULL END,
                version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """, nextCount, finished ? "COMPLETED" : "ACTIVE", finished,
            workspaceId, id, version);
        requireChanged(workspaceId, id, changed);
        return find(workspaceId, id);
    }

    TriggerResponse setStatus(UUID workspaceId, UUID id, TriggerStatus status, long version) {
        int changed = jdbc.update("""
            UPDATE shiftarc.trigger_rule SET status = ?,
                next_due_at = CASE WHEN ? = 'ACTIVE' AND schedule_type = 'INTERVAL'
                    THEN COALESCE(next_due_at, current_timestamp) ELSE next_due_at END,
                version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """, status.name(), status.name(), workspaceId, id, version);
        requireChanged(workspaceId, id, changed);
        return find(workspaceId, id);
    }

    boolean activeCategory(UUID workspaceId, UUID id) {
        Integer count = jdbc.queryForObject(
            "SELECT count(*) FROM shiftarc.category WHERE workspace_id = ? AND id = ? AND archived = false",
            Integer.class, workspaceId, id);
        return count != null && count == 1;
    }

    boolean activeDayType(UUID workspaceId, UUID id) {
        Integer count = jdbc.queryForObject(
            "SELECT count(*) FROM shiftarc.day_type WHERE workspace_id = ? AND id = ? AND archived = false",
            Integer.class, workspaceId, id);
        return count != null && count == 1;
    }

    private TriggerResponse map(ResultSet rs) throws SQLException {
        UUID id = rs.getObject("id", UUID.class);
        return new TriggerResponse(id, TriggerType.valueOf(rs.getString("trigger_type")),
            TriggerScheduleType.valueOf(rs.getString("schedule_type")), rs.getString("title"),
            rs.getString("description"), rs.getInt("importance"), rs.getInt("duration_minutes"),
            integer(rs, "interval_minutes"), integer(rs, "occurrence_target"),
            rs.getInt("completed_occurrences"), instant(rs, "next_due_at"),
            TriggerStatus.valueOf(rs.getString("status")), categories(id), dayTypes(id), rs.getLong("version"));
    }

    private List<TriggerResponse.Category> categories(UUID id) {
        return jdbc.query("""
            SELECT c.id, c.name, c.color FROM shiftarc.trigger_rule_category link
            JOIN shiftarc.category c ON c.id = link.category_id
            WHERE link.trigger_rule_id = ? ORDER BY lower(c.name)
            """, (rs, row) -> new TriggerResponse.Category(rs.getObject("id", UUID.class),
            rs.getString("name"), rs.getString("color")), id);
    }

    private void replaceCategories(UUID id, List<UUID> categories) {
        jdbc.update("DELETE FROM shiftarc.trigger_rule_category WHERE trigger_rule_id = ?", id);
        categories.stream().distinct().forEach(category -> jdbc.update(
            "INSERT INTO shiftarc.trigger_rule_category (trigger_rule_id, category_id) VALUES (?, ?)", id, category));
    }

    private List<TriggerResponse.DayType> dayTypes(UUID id) {
        return jdbc.query("""
            SELECT d.id, d.name, d.color FROM shiftarc.trigger_rule_day_type link
            JOIN shiftarc.day_type d ON d.id = link.day_type_id
            WHERE link.trigger_rule_id = ? ORDER BY lower(d.name)
            """, (rs, row) -> new TriggerResponse.DayType(rs.getObject("id", UUID.class),
            rs.getString("name"), rs.getString("color")), id);
    }

    private void replaceDayTypes(UUID id, List<UUID> dayTypes) {
        jdbc.update("DELETE FROM shiftarc.trigger_rule_day_type WHERE trigger_rule_id = ?", id);
        dayTypes.stream().distinct().forEach(dayType -> jdbc.update(
            "INSERT INTO shiftarc.trigger_rule_day_type (trigger_rule_id, day_type_id) VALUES (?, ?)", id, dayType));
    }

    private void requireChanged(UUID workspaceId, UUID id, int changed) {
        if (changed == 1) return;
        find(workspaceId, id);
        throw new TriggerConflictException("Trigger was changed by another request");
    }

    private Integer integer(ResultSet rs, String name) throws SQLException {
        int value = rs.getInt(name); return rs.wasNull() ? null : value;
    }
    private Instant instant(ResultSet rs, String name) throws SQLException {
        Timestamp value = rs.getTimestamp(name); return value == null ? null : value.toInstant();
    }
    private Timestamp timestamp(Instant value) { return value == null ? null : Timestamp.from(value); }
}
