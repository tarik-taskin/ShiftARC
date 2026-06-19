package com.shiftarc.api.workspace;

import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/workspace")
public class WorkspaceController {

    private final WorkspaceService workspaceService;

    WorkspaceController(WorkspaceService workspaceService) {
        this.workspaceService = workspaceService;
    }

    @GetMapping
    WorkspaceResponse getWorkspace() {
        return workspaceService.getLocalWorkspace();
    }

    @PatchMapping("/settings")
    WorkspaceResponse updateSettings(
        @Valid @RequestBody WorkspaceSettingsUpdateRequest request
    ) {
        return workspaceService.updateSettings(request);
    }
}
