package com.shiftarc.api.calendar;

import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = CalendarOverrideController.class)
class CalendarOverrideApiExceptionHandler {
    @ExceptionHandler(CalendarOverrideNotFoundException.class)
    ProblemDetail missing(CalendarOverrideNotFoundException e, HttpServletRequest r) { return problem(HttpStatus.NOT_FOUND, e, r); }
    @ExceptionHandler(CalendarOverrideConflictException.class)
    ProblemDetail conflict(CalendarOverrideConflictException e, HttpServletRequest r) { return problem(HttpStatus.CONFLICT, e, r); }
    @ExceptionHandler(CalendarOverrideValidationException.class)
    ProblemDetail invalid(CalendarOverrideValidationException e, HttpServletRequest r) { return problem(HttpStatus.BAD_REQUEST, e, r); }
    private ProblemDetail problem(HttpStatus status, RuntimeException exception, HttpServletRequest request) {
        ProblemDetail value = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        value.setType(URI.create("/problems/calendar-override-" + status.value()));
        value.setTitle("Calendar override request failed"); value.setInstance(URI.create(request.getRequestURI())); return value;
    }
}
