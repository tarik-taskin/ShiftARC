package com.shiftarc.api.pomodoro;

import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class PomodoroService {
    private final PomodoroRepository repository;
    PomodoroService(PomodoroRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    PomodoroStateResponse state() { return repository.state(LocalWorkspace.ID); }

    @Transactional
    PomodoroStateResponse start(PomodoroRequests.Start request) {
        if (request.taskId() != null && !repository.activeTask(LocalWorkspace.ID, request.taskId())) {
            throw new PomodoroValidationException("Pomodoro can only reference an active workspace task");
        }
        PomodoroStateResponse.Settings settings = repository.state(LocalWorkspace.ID).settings();
        int duration = switch (request.phase()) {
            case FOCUS -> settings.focusMinutes();
            case SHORT_BREAK -> settings.shortBreakMinutes();
            case LONG_BREAK -> settings.longBreakMinutes();
        };
        try {
            repository.start(LocalWorkspace.ID, request.phase(), request.taskId(), duration);
        } catch (DataIntegrityViolationException exception) {
            throw new PomodoroConflictException("Only one pomodoro session can be active");
        }
        return repository.state(LocalWorkspace.ID);
    }

    @Transactional
    PomodoroStateResponse finish(PomodoroRequests.Finish request, boolean cancelled) {
        repository.finish(LocalWorkspace.ID, request.sessionId(), request.version(), cancelled ? "CANCELLED" : "COMPLETED");
        return repository.state(LocalWorkspace.ID);
    }

    @Transactional
    PomodoroStateResponse settings(PomodoroRequests.Settings request) {
        repository.updateSettings(LocalWorkspace.ID, request);
        return repository.state(LocalWorkspace.ID);
    }
}
