package com.shiftarc.api.daytype;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = DayTypeController.class)
class DayTypeApiExceptionHandler {

    @ExceptionHandler(DayTypeNotFoundException.class)
    ProblemDetail notFound(DayTypeNotFoundException exception, HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, "day-type-not-found", "Day type not found", exception, request);
    }

    @ExceptionHandler(DayTypeConflictException.class)
    ProblemDetail conflict(DayTypeConflictException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "day-type-conflict", "Day type conflict", exception, request);
    }

    @ExceptionHandler(DayTypeValidationException.class)
    ProblemDetail invalid(DayTypeValidationException exception, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "invalid-day-type-timeline", "Invalid day type timeline", exception, request);
    }

    private ProblemDetail problem(
        HttpStatus status,
        String type,
        String title,
        RuntimeException exception,
        HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        problem.setType(URI.create("/problems/" + type));
        problem.setTitle(title);
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
