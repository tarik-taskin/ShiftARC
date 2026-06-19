package com.shiftarc.api.task;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record TaskWriteRequest(
    @NotNull TaskType type,
    @NotBlank @Size(max = 160) String title,
    @Size(max = 2000) String description,
    @Min(1) @Max(5) short importance,
    @Positive Integer totalRequiredMinutes,
    LocalDate deadline,
    @Positive Integer weeklyTargetMinutes,
    @NotNull @Size(max = 64) List<@NotNull UUID> categoryIds,
    @PositiveOrZero Long version
) {
}
