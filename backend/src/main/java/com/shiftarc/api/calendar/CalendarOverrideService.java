package com.shiftarc.api.calendar;

import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class CalendarOverrideService {
    private final CalendarOverrideRepository repository;
    private final JdbcTemplate jdbc;
    CalendarOverrideService(CalendarOverrideRepository repository, JdbcTemplate jdbc) {
        this.repository = repository; this.jdbc = jdbc;
    }
    @Transactional(readOnly = true)
    List<CalendarOverrideResponse> list(LocalDate from, LocalDate to) {
        if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > 370) {
            throw new CalendarOverrideValidationException("Override range must be ordered and at most 371 days");
        }
        return repository.list(LocalWorkspace.ID, from, to);
    }
    @Transactional
    CalendarOverrideResponse save(LocalDate date, CalendarOverrideRequest request) {
        validateMutable(date);
        if (!repository.activeDayType(LocalWorkspace.ID, request.dayTypeId())) {
            throw new CalendarOverrideValidationException("Override requires an active workspace day type");
        }
        return repository.save(LocalWorkspace.ID, date, request);
    }
    @Transactional
    void delete(LocalDate date, long version) {
        validateMutable(date); repository.delete(LocalWorkspace.ID, date, version);
    }
    private void validateMutable(LocalDate date) {
        String timezone = jdbc.queryForObject("SELECT timezone FROM shiftarc.workspace_settings WHERE workspace_id = ?",
            String.class, LocalWorkspace.ID);
        if (date.isBefore(LocalDate.now(ZoneId.of(timezone)))) {
            throw new CalendarOverrideValidationException("Past dates cannot be changed");
        }
        if (repository.snapshotExists(LocalWorkspace.ID, date)) {
            throw new CalendarOverrideConflictException("A generated daily snapshot already fixes this date");
        }
    }
}
