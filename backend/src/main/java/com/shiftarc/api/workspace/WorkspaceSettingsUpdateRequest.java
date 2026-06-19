package com.shiftarc.api.workspace;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;

public record WorkspaceSettingsUpdateRequest(
    @NotBlank @Size(max = 64) String timezone,
    @NotBlank
    @Pattern(regexp = "^(arc-midnight|dawn|aurora)$")
    String themeId,
    @NotNull BackgroundMode backgroundMode,
    @PositiveOrZero long version
) {
}
