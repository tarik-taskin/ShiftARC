package com.shiftarc.api.daytype;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record DayTypeBlocksUpdateRequest(
    @PositiveOrZero long version,
    @NotEmpty @Size(max = 288) List<@Valid Block> blocks
) {
    public record Block(
        @NotBlank @Size(max = 80) String name,
        @Min(0) @Max(1435) int startMinute,
        @Min(5) @Max(1440) int endMinute,
        @NotNull @Size(max = 64) List<@NotNull UUID> categoryIds
    ) {
    }
}
