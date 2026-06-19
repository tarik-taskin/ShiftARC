package com.shiftarc.api.task;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/tasks")
public class TaskController {

    private final TaskService service;

    TaskController(TaskService service) {
        this.service = service;
    }

    @GetMapping
    List<TaskResponse> list(
        @RequestParam(required = false) TaskType type,
        @RequestParam(required = false) TaskStatus status,
        @RequestParam(required = false) UUID categoryId,
        @RequestParam(defaultValue = "") @Size(max = 160) String search,
        @RequestParam(defaultValue = "PRIORITY") TaskSort sort
    ) {
        return service.list(type, status, categoryId, search, sort);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    TaskResponse create(@Valid @RequestBody TaskWriteRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    TaskResponse update(@PathVariable UUID id, @Valid @RequestBody TaskWriteRequest request) {
        return service.update(id, request);
    }

    @PostMapping("/{id}/status/{status}")
    TaskResponse setStatus(
        @PathVariable UUID id,
        @PathVariable TaskStatus status,
        @RequestParam @PositiveOrZero long version
    ) {
        return service.setStatus(id, status, version);
    }
}
