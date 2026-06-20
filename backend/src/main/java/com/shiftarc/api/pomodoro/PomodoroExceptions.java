package com.shiftarc.api.pomodoro;

class PomodoroNotFoundException extends RuntimeException {
    PomodoroNotFoundException() { super("Pomodoro session not found"); }
}
class PomodoroConflictException extends RuntimeException {
    PomodoroConflictException(String message) { super(message); }
}
class PomodoroValidationException extends RuntimeException {
    PomodoroValidationException(String message) { super(message); }
}
