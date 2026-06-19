package com.shiftarc.api.weeklyplan;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record WeeklyPlanUpdateRequest(
    @PositiveOrZero long version,
    @NotNull @Size(max = 7) List<@Valid Assignment> assignments
) {
    public record Assignment(
        @Min(1) @Max(7) short dayOfWeek,
        @NotNull UUID dayTypeId
    ) {
    }
}
