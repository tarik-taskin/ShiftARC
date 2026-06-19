package com.shiftarc.api.weeklyplan;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = WeeklyPlanController.class)
class WeeklyPlanApiExceptionHandler {

    @ExceptionHandler(WeeklyPlanConflictException.class)
    ProblemDetail conflict(WeeklyPlanConflictException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "weekly-plan-conflict", "Weekly plan conflict", exception, request);
    }

    @ExceptionHandler(WeeklyPlanValidationException.class)
    ProblemDetail invalid(WeeklyPlanValidationException exception, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "invalid-weekly-plan", "Invalid weekly plan", exception, request);
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
