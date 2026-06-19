package com.shiftarc.api.category;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record CategoryUpdateRequest(
    @NotBlank @Size(max = 80) String name,
    @NotBlank @Pattern(regexp = "^#[0-9A-Fa-f]{6}$") String color,
    @Size(max = 64) String icon,
    @PositiveOrZero long version
) {
}
