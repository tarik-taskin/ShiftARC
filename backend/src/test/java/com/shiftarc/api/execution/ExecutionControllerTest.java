package com.shiftarc.api.execution;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ExecutionControllerTest {
    private final ExecutionService service = org.mockito.Mockito.mock(ExecutionService.class);
    private MockMvc mockMvc;

    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ExecutionController(service))
            .setControllerAdvice(new ExecutionApiExceptionHandler()).build();
    }

    @Test void returnsTodayState() throws Exception {
        when(service.state()).thenReturn(emptyState());
        mockMvc.perform(get("/api/v1/execution/today"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.sessions.length()").value(0));
    }

    @Test void validatesStartItemId() throws Exception {
        mockMvc.perform(post("/api/v1/execution/start").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }

    @Test void startsAPlannedItem() throws Exception {
        when(service.start(any())).thenReturn(emptyState());
        mockMvc.perform(post("/api/v1/execution/start").contentType(MediaType.APPLICATION_JSON)
                .content("{\"dailyPlanItemId\":\"73000000-0000-0000-0000-000000000001\"}"))
            .andExpect(status().isOk());
    }

    @Test void correctsSessionTimes() throws Exception {
        when(service.correct(any(), any())).thenReturn(emptyState());
        mockMvc.perform(patch("/api/v1/execution/sessions/{id}/times", "81000000-0000-0000-0000-000000000001")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"startedAt":"2026-06-20T10:00:00Z","endedAt":"2026-06-20T10:30:00Z","version":1}
                    """))
            .andExpect(status().isOk());
    }

    private ExecutionStateResponse emptyState() {
        return new ExecutionStateResponse(LocalDate.of(2026, 6, 20), "Europe/Istanbul", null, List.of());
    }
}
