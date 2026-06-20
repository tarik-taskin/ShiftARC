package com.shiftarc.api.pomodoro;

import java.util.UUID;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public final class PomodoroRequests {
    private PomodoroRequests() {}
    public record Start(@NotNull PomodoroPhase phase, UUID taskId) {}
    public record Finish(@NotNull UUID sessionId, @Min(0) long version) {}
    public record Settings(@Min(5) @Max(120) int focusMinutes,
                           @Min(1) @Max(30) int shortBreakMinutes,
                           @Min(5) @Max(60) int longBreakMinutes,
                           @Min(2) @Max(8) int cyclesBeforeLongBreak,
                           @Min(0) long version) {}
}
