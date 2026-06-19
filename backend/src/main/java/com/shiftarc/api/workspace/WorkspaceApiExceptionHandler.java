package com.shiftarc.api.workspace;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = { WorkspaceController.class, OnboardingController.class })
class WorkspaceApiExceptionHandler {

    @ExceptionHandler(WorkspaceNotFoundException.class)
    ProblemDetail handleNotFound(
        WorkspaceNotFoundException exception,
        HttpServletRequest request
    ) {
        return problem(
            HttpStatus.NOT_FOUND,
            "/problems/workspace-not-found",
            "Workspace not found",
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(WorkspaceConflictException.class)
    ProblemDetail handleConflict(
        WorkspaceConflictException exception,
        HttpServletRequest request
    ) {
        return problem(
            HttpStatus.CONFLICT,
            "/problems/workspace-conflict",
            "Workspace conflict",
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(InvalidWorkspacePreferenceException.class)
    ProblemDetail handleInvalidPreference(
        InvalidWorkspacePreferenceException exception,
        HttpServletRequest request
    ) {
        return problem(
            HttpStatus.BAD_REQUEST,
            "/problems/invalid-workspace-preference",
            "Invalid workspace preference",
            exception.getMessage(),
            request
        );
    }

    private ProblemDetail problem(
        HttpStatus status,
        String type,
        String title,
        String detail,
        HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(status, detail);
        problem.setType(URI.create(type));
        problem.setTitle(title);
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
