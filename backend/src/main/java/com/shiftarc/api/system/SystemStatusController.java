package com.shiftarc.api.system;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping(path = "/api/v1/system", produces = MediaType.APPLICATION_JSON_VALUE)
class SystemStatusController {

    private final SystemStatusService systemStatusService;

    SystemStatusController(SystemStatusService systemStatusService) {
        this.systemStatusService = systemStatusService;
    }

    @GetMapping("/status")
    SystemStatusResponse getStatus() {
        return systemStatusService.getStatus();
    }
}
