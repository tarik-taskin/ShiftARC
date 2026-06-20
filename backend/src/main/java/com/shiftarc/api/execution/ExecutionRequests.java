package com.shiftarc.api.execution;

import java.time.Instant;
import java.util.UUID;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

final class ExecutionRequests {
    private ExecutionRequests() {}

    record Start(@NotNull UUID dailyPlanItemId, Instant startedAt) {}
    record Finish(@NotNull UUID sessionId, Instant endedAt, @PositiveOrZero long version) {}
    record Transition(
        @NotNull UUID sessionId,
        @NotNull UUID nextDailyPlanItemId,
        Instant occurredAt,
        @PositiveOrZero long version
    ) {}
}
