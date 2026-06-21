package com.shiftarc.api.calendar;

import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class CalendarOverrideRepository {
    private final JdbcTemplate jdbc;
    CalendarOverrideRepository(JdbcTemplate jdbc) { this.jdbc = jdbc; }

    List<CalendarOverrideResponse> list(UUID workspaceId, LocalDate from, LocalDate to) {
        return jdbc.query("""
            SELECT override.override_date, day_type.id, day_type.name, day_type.color, override.version
            FROM shiftarc.calendar_day_override override
            JOIN shiftarc.day_type day_type ON day_type.id = override.day_type_id
            WHERE override.workspace_id = ? AND override.override_date BETWEEN ? AND ?
            ORDER BY override.override_date
            """, (rs, row) -> new CalendarOverrideResponse(rs.getDate("override_date").toLocalDate(),
            rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("color"), rs.getLong("version")),
            workspaceId, Date.valueOf(from), Date.valueOf(to));
    }

    CalendarOverrideResponse save(UUID workspaceId, LocalDate date, CalendarOverrideRequest request) {
        if (request.version() == null) {
            try {
                jdbc.update("INSERT INTO shiftarc.calendar_day_override (workspace_id, override_date, day_type_id) VALUES (?, ?, ?)",
                    workspaceId, Date.valueOf(date), request.dayTypeId());
            } catch (org.springframework.dao.DuplicateKeyException exception) {
                throw new CalendarOverrideConflictException("An override already exists; refresh before editing");
            }
        } else {
            int changed = jdbc.update("""
                UPDATE shiftarc.calendar_day_override SET day_type_id = ?, version = version + 1,
                    updated_at = current_timestamp WHERE workspace_id = ? AND override_date = ? AND version = ?
                """, request.dayTypeId(), workspaceId, Date.valueOf(date), request.version());
            requireChanged(workspaceId, date, changed);
        }
        return find(workspaceId, date);
    }

    void delete(UUID workspaceId, LocalDate date, long version) {
        int changed = jdbc.update("DELETE FROM shiftarc.calendar_day_override WHERE workspace_id = ? AND override_date = ? AND version = ?",
            workspaceId, Date.valueOf(date), version);
        requireChanged(workspaceId, date, changed);
    }

    boolean activeDayType(UUID workspaceId, UUID dayTypeId) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM shiftarc.day_type WHERE workspace_id = ? AND id = ? AND archived = false",
            Integer.class, workspaceId, dayTypeId); return count != null && count == 1;
    }
    boolean snapshotExists(UUID workspaceId, LocalDate date) {
        Integer count = jdbc.queryForObject("SELECT count(*) FROM shiftarc.daily_plan WHERE workspace_id = ? AND plan_date = ?",
            Integer.class, workspaceId, Date.valueOf(date)); return count != null && count > 0;
    }
    private CalendarOverrideResponse find(UUID workspaceId, LocalDate date) {
        return list(workspaceId, date, date).stream().findFirst().orElseThrow(CalendarOverrideNotFoundException::new);
    }
    private void requireChanged(UUID workspaceId, LocalDate date, int changed) {
        if (changed == 1) return;
        if (list(workspaceId, date, date).isEmpty()) throw new CalendarOverrideNotFoundException();
        throw new CalendarOverrideConflictException("Calendar override was changed by another request");
    }
}
