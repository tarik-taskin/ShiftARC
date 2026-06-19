package com.shiftarc.api.workspace;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/onboarding")
public class OnboardingController {

    private final WorkspaceService workspaceService;

    OnboardingController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @PostMapping
    WorkspaceResponse completeOnboarding(@Valid @RequestBody OnboardingRequest request) {
        return workspaceService.completeOnboarding(request);
    }
}
