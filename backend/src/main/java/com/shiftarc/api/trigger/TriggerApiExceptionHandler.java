package com.shiftarc.api.trigger;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = TriggerController.class)
class TriggerApiExceptionHandler {
    @ExceptionHandler(TriggerNotFoundException.class)
    ProblemDetail notFound(TriggerNotFoundException exception, HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, "trigger-not-found", exception.getMessage(), request);
    }
    @ExceptionHandler(TriggerConflictException.class)
    ProblemDetail conflict(TriggerConflictException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "trigger-conflict", exception.getMessage(), request);
    }
    @ExceptionHandler(TriggerValidationException.class)
    ProblemDetail invalid(TriggerValidationException exception, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "trigger-invalid", exception.getMessage(), request);
    }
    private ProblemDetail problem(HttpStatus status, String type, String detail, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create("/problems/" + type));
        problem.setTitle("Trigger request failed");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
