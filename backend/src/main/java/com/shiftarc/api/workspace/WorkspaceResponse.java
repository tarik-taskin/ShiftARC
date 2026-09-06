package com.shiftarc.api.workspace;

import java.util.UUID;

public record WorkspaceResponse(
    UUID id,
    String name,
    String timezone,
    short weekStartsOn,
    String themeId,
    BackgroundMode backgroundMode,
    boolean onboardingCompleted,
    long version,
    ColorMode colorMode,
    ClockStyle clockStyle
) {
}
