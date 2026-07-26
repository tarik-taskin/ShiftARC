package com.shiftarc.api.trigger;

import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record TriggerWriteRequest(
    @NotNull TriggerType type,
    @NotNull TriggerScheduleType scheduleType,
    @NotBlank @Size(max = 160) String title,
    @Size(max = 1000) String description,
    @Min(1) @Max(5) int importance,
    @Min(5) int durationMinutes,
    Integer intervalMinutes,
    Integer occurrenceTarget,
    @NotNull List<UUID> categoryIds,
    @NotNull List<UUID> dayTypeIds,
    Long version
) {}
