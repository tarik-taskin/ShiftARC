package com.shiftarc.api.daytype;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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
@RequestMapping("/api/v1/day-types")
public class DayTypeController {

    private final DayTypeService service;

    DayTypeController(DayTypeService service) {
        this.service = service;
    }

    @GetMapping
    List<DayTypeResponse> list(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(includeArchived);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    DayTypeResponse create(@Valid @RequestBody DayTypeCreateRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    DayTypeResponse update(@PathVariable UUID id, @Valid @RequestBody DayTypeUpdateRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void archive(@PathVariable UUID id, @RequestParam @PositiveOrZero long version) {
        service.archive(id, version);
    }

    @PostMapping("/{id}/restore")
    DayTypeResponse restore(@PathVariable UUID id, @RequestParam @PositiveOrZero long version) {
        return service.restore(id, version);
    }

    @PostMapping("/{id}/duplicate")
    @ResponseStatus(HttpStatus.CREATED)
    DayTypeResponse duplicate(@PathVariable UUID id) {
        return service.duplicate(id);
    }

    @PutMapping("/{id}/blocks")
    DayTypeResponse replaceBlocks(
        @PathVariable UUID id,
        @Valid @RequestBody DayTypeBlocksUpdateRequest request
    ) {
        return service.replaceBlocks(id, request);
    }
}
