package com.shiftarc.api.trigger;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record TriggerResponse(
    UUID id,
    TriggerType type,
    TriggerScheduleType scheduleType,
    String title,
    String description,
    int importance,
    int durationMinutes,
    Integer intervalMinutes,
    Integer occurrenceTarget,
    int completedOccurrences,
    Instant nextDueAt,
    TriggerStatus status,
    List<Category> categories,
    List<DayType> dayTypes,
    long version
) {
    public record Category(UUID id, String name, String color) {}
    public record DayType(UUID id, String name, String color) {}
}
