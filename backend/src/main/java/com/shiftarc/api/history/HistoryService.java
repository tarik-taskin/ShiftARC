package com.shiftarc.api.history;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.List;

import com.shiftarc.api.dailyplan.DailyPlanResponse;
import com.shiftarc.api.dailyplan.DailyPlanService;
import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class HistoryService {
    private final HistoryRepository repository;
    private final DailyPlanService dailyPlans;
    private final JdbcTemplate jdbc;

    HistoryService(HistoryRepository repository, DailyPlanService dailyPlans, JdbcTemplate jdbc) {
        this.repository = repository; this.dailyPlans = dailyPlans; this.jdbc = jdbc;
    }

    @Transactional(readOnly = true)
    List<HistoryResponse.Day> days(LocalDate from, LocalDate to) {
        validateRange(from, to);
        return repository.days(LocalWorkspace.ID, from, to);
    }

    @Transactional(readOnly = true)
    HistoryResponse.Detail detail(LocalDate date) {
        DailyPlanResponse plan = dailyPlans.findSnapshot(date);
        if (plan == null) throw new HistoryNotFoundException();
        HistoryResponse.Day summary = repository.days(LocalWorkspace.ID, date, date).stream()
            .findFirst().orElseThrow(HistoryNotFoundException::new);
        String timezone = jdbc.queryForObject(
            "SELECT timezone FROM shiftarc.workspace_settings WHERE workspace_id = ?",
            String.class, LocalWorkspace.ID);
        return new HistoryResponse.Detail(summary, plan,
            repository.sessions(LocalWorkspace.ID, date, timezone),
            repository.events(LocalWorkspace.ID, date, timezone));
    }

    private void validateRange(LocalDate from, LocalDate to) {
        if (from.isAfter(to) || ChronoUnit.DAYS.between(from, to) > 62) {
            throw new IllegalArgumentException("History range must be ordered and at most 63 days");
        }
    }
}
