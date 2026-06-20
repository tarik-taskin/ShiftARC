package com.shiftarc.api.pomodoro;

import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = PomodoroController.class)
class PomodoroApiExceptionHandler {
    @ExceptionHandler(PomodoroNotFoundException.class)
    ProblemDetail notFound(PomodoroNotFoundException e, HttpServletRequest r) { return problem(HttpStatus.NOT_FOUND, e, r); }
    @ExceptionHandler(PomodoroConflictException.class)
    ProblemDetail conflict(PomodoroConflictException e, HttpServletRequest r) { return problem(HttpStatus.CONFLICT, e, r); }
    @ExceptionHandler(PomodoroValidationException.class)
    ProblemDetail invalid(PomodoroValidationException e, HttpServletRequest r) { return problem(HttpStatus.BAD_REQUEST, e, r); }
    private ProblemDetail problem(HttpStatus status, RuntimeException exception, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        problem.setType(URI.create("/problems/pomodoro-" + status.value()));
        problem.setTitle("Pomodoro request failed"); problem.setInstance(URI.create(request.getRequestURI())); return problem;
    }
}
