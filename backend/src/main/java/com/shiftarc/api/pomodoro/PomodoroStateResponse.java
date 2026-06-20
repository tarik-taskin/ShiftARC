package com.shiftarc.api.pomodoro;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record PomodoroStateResponse(Settings settings, Session activeSession,
                                    List<Session> recentSessions, int focusCyclesToday) {
    public record Settings(int focusMinutes, int shortBreakMinutes, int longBreakMinutes,
                           int cyclesBeforeLongBreak, long version) {}
    public record Session(UUID id, PomodoroPhase phase, String status, int durationMinutes,
                          UUID taskId, String taskTitle, Instant startedAt,
                          Instant plannedEndAt, Instant endedAt, long version) {}
}
