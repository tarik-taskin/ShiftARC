package com.shiftarc.api.system;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = SystemStatusController.class)
class SystemApiExceptionHandler {

    private static final URI DATABASE_UNAVAILABLE_TYPE = URI.create("/problems/database-unavailable");

    @ExceptionHandler(DatabaseUnavailableException.class)
    ProblemDetail handleDatabaseUnavailable(
        DatabaseUnavailableException exception,
        HttpServletRequest request
    ) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(
            HttpStatus.SERVICE_UNAVAILABLE,
            "The database is temporarily unavailable."
        );
        problem.setType(DATABASE_UNAVAILABLE_TYPE);
        problem.setTitle("Database unavailable");
        problem.setInstance(URI.create(request.getRequestURI()));
        return problem;
    }
}
