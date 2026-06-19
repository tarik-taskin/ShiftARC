package com.shiftarc.api.task;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = TaskController.class)
class TaskApiExceptionHandler {
    @ExceptionHandler(TaskNotFoundException.class)
    ProblemDetail notFound(TaskNotFoundException exception, HttpServletRequest request) {
        return problem(HttpStatus.NOT_FOUND, "task-not-found", "Task not found", exception, request);
    }

    @ExceptionHandler(TaskConflictException.class)
    ProblemDetail conflict(TaskConflictException exception, HttpServletRequest request) {
        return problem(HttpStatus.CONFLICT, "task-conflict", "Task conflict", exception, request);
    }

    @ExceptionHandler(TaskValidationException.class)
    ProblemDetail invalid(TaskValidationException exception, HttpServletRequest request) {
        return problem(HttpStatus.BAD_REQUEST, "invalid-task", "Invalid task", exception, request);
    }

    private ProblemDetail problem(HttpStatus status, String type, String title, RuntimeException exception, HttpServletRequest request) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, exception.getMessage());
        problem.setType(URI.create("/problems/" + type));
        problem.setTitle(title);
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
