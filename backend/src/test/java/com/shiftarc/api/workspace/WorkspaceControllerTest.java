package com.shiftarc.api.workspace;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WorkspaceControllerTest {

    private WorkspaceService service;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        service = mock(WorkspaceService.class);
        mockMvc = MockMvcBuilders
            .standaloneSetup(
                new WorkspaceController(service),
                new OnboardingController(service)
            )
            .setControllerAdvice(new WorkspaceApiExceptionHandler())
            .build();
    }

    @Test
    void returnsTheWorkspaceContract() throws Exception {
        when(service.getLocalWorkspace()).thenReturn(workspaceResponse());

        mockMvc.perform(get("/api/v1/workspace").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(LocalWorkspace.ID.toString()))
            .andExpect(jsonPath("$.timezone").value("Europe/Istanbul"))
            .andExpect(jsonPath("$.themeId").value("arc-midnight"))
            .andExpect(jsonPath("$.backgroundMode").value("TIME_AWARE"))
            .andExpect(jsonPath("$.onboardingCompleted").value(false))
            .andExpect(jsonPath("$.version").value(0));
    }

    @Test
    void updatesSettingsAndCompletesOnboarding() throws Exception {
        when(service.updateSettings(any())).thenReturn(workspaceResponse());
        when(service.completeOnboarding(any())).thenReturn(workspaceResponse());

        mockMvc.perform(patch("/api/v1/workspace/settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "timezone": "Europe/Istanbul",
                      "themeId": "dawn",
                      "backgroundMode": "STATIC",
                      "version": 0
                    }
                    """))
            .andExpect(status().isOk());

        mockMvc.perform(post("/api/v1/onboarding")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "timezone": "Europe/Istanbul",
                      "themeId": "aurora",
                      "backgroundMode": "TIME_AWARE",
                      "includeSampleData": true,
                      "version": 0
                    }
                    """))
            .andExpect(status().isOk());
    }

    @Test
    void returnsProblemDetailsForWorkspaceConflicts() throws Exception {
        when(service.completeOnboarding(any())).thenThrow(
            new WorkspaceConflictException("Onboarding has already been completed")
        );

        mockMvc.perform(post("/api/v1/onboarding")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "timezone": "Europe/Istanbul",
                      "themeId": "arc-midnight",
                      "backgroundMode": "TIME_AWARE",
                      "includeSampleData": false,
                      "version": 0
                    }
                    """))
            .andExpect(status().isConflict())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.type").value("/problems/workspace-conflict"))
            .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    void rejectsUnsupportedThemeRequestsBeforeCallingTheService() throws Exception {
        mockMvc.perform(patch("/api/v1/workspace/settings")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {
                      "timezone": "Europe/Istanbul",
                      "themeId": "unknown-theme",
                      "backgroundMode": "STATIC",
                      "version": 0
                    }
                    """))
            .andExpect(status().isBadRequest());
    }

    private WorkspaceResponse workspaceResponse() {
        return new WorkspaceResponse(
            LocalWorkspace.ID,
            "Lokal Çalışma Alanı",
            "Europe/Istanbul",
            (short) 1,
            "arc-midnight",
            BackgroundMode.TIME_AWARE,
            false,
            0
        );
    }
}
