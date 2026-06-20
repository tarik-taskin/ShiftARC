package com.shiftarc.api.execution;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record ExecutionStateResponse(
    LocalDate date,
    String timezone,
    Session activeSession,
    List<Session> sessions
) {
    public record Session(
        UUID id,
        UUID taskId,
        String taskTitle,
        UUID dailyPlanItemId,
        Instant startedAt,
        Instant endedAt,
        long version,
        long durationSeconds
    ) {
    }
}
