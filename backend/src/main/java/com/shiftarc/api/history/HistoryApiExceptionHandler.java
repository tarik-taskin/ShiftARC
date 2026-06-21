package com.shiftarc.api.history;

import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = HistoryController.class)
class HistoryApiExceptionHandler {
    @ExceptionHandler(HistoryNotFoundException.class)
    ProblemDetail notFound(HistoryNotFoundException e, HttpServletRequest r) {
        return problem(HttpStatus.NOT_FOUND, e.getMessage(), r);
    }
    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail invalid(IllegalArgumentException e, HttpServletRequest r) {
        return problem(HttpStatus.BAD_REQUEST, e.getMessage(), r);
    }
    private ProblemDetail problem(HttpStatus status, String detail, HttpServletRequest request) {
        ProblemDetail value = ProblemDetail.forStatusAndDetail(status, detail);
        value.setType(URI.create("/problems/history-" + status.value()));
        value.setTitle("History request failed"); value.setInstance(URI.create(request.getRequestURI())); return value;
    }
}
