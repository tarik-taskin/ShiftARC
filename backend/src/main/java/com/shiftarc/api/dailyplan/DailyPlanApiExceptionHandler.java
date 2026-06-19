package com.shiftarc.api.dailyplan;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = DailyPlanController.class)
class DailyPlanApiExceptionHandler {
    @ExceptionHandler(DailyPlanUnavailableException.class)
    ProblemDetail unavailable(DailyPlanUnavailableException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "daily-plan-unavailable", "Daily plan unavailable", exception, request);
    }

    @ExceptionHandler(DailyPlanConflictException.class)
    ProblemDetail conflict(DailyPlanConflictException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "daily-plan-conflict", "Daily plan conflict", exception, request);
    }

    private ProblemDetail problem(HttpStatus status, String type, String title, RuntimeException exception, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        problem.setType(URI.create("/problems/" + type)); problem.setTitle(title); problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
