package com.shiftarc.api.execution;

import java.net.URI;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = ExecutionController.class)
class ExecutionApiExceptionHandler {
    @ExceptionHandler(ExecutionNotFoundException.class) ProblemDetail notFound(ExecutionNotFoundException e, HttpServletRequest r) { return problem(HttpStatus.NOT_FOUND, "execution-not-found", "Execution not found", e, r); }
    @ExceptionHandler(ExecutionConflictException.class) ProblemDetail conflict(ExecutionConflictException e, HttpServletRequest r) { return problem(HttpStatus.CONFLICT, "execution-conflict", "Execution conflict", e, r); }
    @ExceptionHandler(ExecutionValidationException.class) ProblemDetail invalid(ExecutionValidationException e, HttpServletRequest r) { return problem(HttpStatus.BAD_REQUEST, "invalid-execution", "Invalid execution", e, r); }
    private ProblemDetail problem(HttpStatus status, String type, String title, RuntimeException e, HttpServletRequest r) { ProblemDetail p = ProblemDetail.forStatusAndDetail(status, e.getMessage()); p.setType(URI.create("/problems/" + type)); p.setTitle(title); p.setInstance(URI.create(r.getRequestURI())); return p; }
}
