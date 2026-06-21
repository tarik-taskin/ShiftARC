package com.shiftarc.api.dailyplan;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.PositiveOrZero;

public record DailyPlanItemAdjustmentRequest(
    @Min(5) @Max(1440) int durationMinutes,
    @Min(1) @Max(5) int priority,
    @PositiveOrZero long version
) {}
