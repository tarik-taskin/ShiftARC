package com.shiftarc.api.trigger;

import java.util.List;
import java.util.UUID;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PositiveOrZero;
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
@RequestMapping("/api/v1/triggers")
class TriggerController {
    private final TriggerService service;
    TriggerController(TriggerService service) { this.service = service; }

    @GetMapping
    List<TriggerResponse> list(@RequestParam(defaultValue = "false") boolean includeArchived) {
        return service.list(includeArchived);
    }
    @PostMapping @ResponseStatus(HttpStatus.CREATED)
    TriggerResponse create(@Valid @RequestBody TriggerWriteRequest request) { return service.create(request); }
    @PutMapping("/{id}")
    TriggerResponse update(@PathVariable UUID id, @Valid @RequestBody TriggerWriteRequest request) { return service.update(id, request); }
    @PostMapping("/{id}/complete")
    TriggerResponse complete(@PathVariable UUID id, @RequestParam @PositiveOrZero long version) { return service.complete(id, version); }
    @PostMapping("/{id}/status/{status}")
    TriggerResponse status(@PathVariable UUID id, @PathVariable TriggerStatus status,
                           @RequestParam @PositiveOrZero long version) { return service.setStatus(id, status, version); }
}
