package com.shiftarc.api.daytype;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record DayTypeCreateRequest(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String color
) {
}
