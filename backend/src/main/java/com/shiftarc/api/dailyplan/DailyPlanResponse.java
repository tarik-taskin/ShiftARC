package com.shiftarc.api.dailyplan;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record DailyPlanResponse(
    UUID id,
    LocalDate date,
    String timezone,
    UUID sourceDayTypeId,
    String sourceDayTypeName,
    String status,
    long version,
    Instant generatedAt,
    List<Block> blocks,
    List<Warning> warnings
) {
    public record Block(UUID id, String name, int startMinute, int endMinute, List<Item> items) {
    }

    public record Item(
        UUID id,
        UUID taskId,
        String taskTitle,
        String taskType,
        int importance,
        int plannedStartMinute,
        int plannedEndMinute,
        String status,
        long version
    ) {
    }

    public record Warning(UUID taskId, String reasonCode, int unallocatedMinutes, String detail) {
    }
}
