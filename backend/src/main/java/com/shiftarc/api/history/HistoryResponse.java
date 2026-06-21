package com.shiftarc.api.history;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.shiftarc.api.dailyplan.DailyPlanResponse;

public final class HistoryResponse {
    private HistoryResponse() {}

    public record Day(
        LocalDate date,
        UUID planId,
        String dayTypeName,
        String status,
        int plannedMinutes,
        int executedMinutes,
        int completedItems,
        int totalItems,
        int sessionCount
    ) {}

    public record Detail(
        Day summary,
        DailyPlanResponse plan,
        List<Session> sessions,
        List<Event> events
    ) {}

    public record Session(
        UUID id,
        UUID taskId,
        String taskTitle,
        Instant startedAt,
        Instant endedAt,
        int durationSeconds
    ) {}

    public record Event(
        UUID id,
        UUID sessionId,
        String type,
        Instant occurredAt,
        String payload
    ) {}
}
