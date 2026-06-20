package com.shiftarc.api.execution;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/execution")
public class ExecutionController {
    private final ExecutionService service;
    ExecutionController(ExecutionService service) { this.service = service; }
    @GetMapping("/today") ExecutionStateResponse state() { return service.state(); }
    @PostMapping("/start") ExecutionStateResponse start(@Valid @RequestBody ExecutionRequests.Start request) { return service.start(request); }
    @PostMapping("/finish") ExecutionStateResponse finish(@Valid @RequestBody ExecutionRequests.Finish request) { return service.finish(request); }
    @PostMapping("/transition") ExecutionStateResponse transition(@Valid @RequestBody ExecutionRequests.Transition request) { return service.transition(request); }
}
