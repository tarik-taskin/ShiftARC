package com.shiftarc.api.pomodoro;

import jakarta.validation.Valid;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/pomodoro")
class PomodoroController {
    private final PomodoroService service;
    PomodoroController(PomodoroService service) { this.service = service; }
    @GetMapping PomodoroStateResponse state() { return service.state(); }
    @PostMapping("/start") PomodoroStateResponse start(@Valid @RequestBody PomodoroRequests.Start request) { return service.start(request); }
    @PostMapping("/complete") PomodoroStateResponse complete(@Valid @RequestBody PomodoroRequests.Finish request) { return service.finish(request, false); }
    @PostMapping("/cancel") PomodoroStateResponse cancel(@Valid @RequestBody PomodoroRequests.Finish request) { return service.finish(request, true); }
    @PutMapping("/settings") PomodoroStateResponse settings(@Valid @RequestBody PomodoroRequests.Settings request) { return service.settings(request); }
}
