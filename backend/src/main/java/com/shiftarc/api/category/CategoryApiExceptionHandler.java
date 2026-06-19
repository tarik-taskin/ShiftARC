package com.shiftarc.api.category;

import java.net.URI;

import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice(assignableTypes = CategoryController.class)
class CategoryApiExceptionHandler {

    @ExceptionHandler(CategoryNotFoundException.class)
    ProblemDetail handleNotFound(
        CategoryNotFoundException exception,
        HttpServletRequest request
    ) {
        return problem(
            HttpStatus.NOT_FOUND,
            "/problems/category-not-found",
            "Category not found",
            exception.getMessage(),
            request
        );
    }

    @ExceptionHandler(CategoryConflictException.class)
    ProblemDetail handleConflict(
        CategoryConflictException exception,
        HttpServletRequest request
    ) {
        return problem(
            HttpStatus.CONFLICT,
            "/problems/category-conflict",
            "Category conflict",
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
