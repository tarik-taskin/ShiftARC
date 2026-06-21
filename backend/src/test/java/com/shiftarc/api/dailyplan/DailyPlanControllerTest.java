package com.shiftarc.api.dailyplan;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class DailyPlanControllerTest {
    private final DailyPlanService service = org.mockito.Mockito.mock(DailyPlanService.class);
    private MockMvc mockMvc;
    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new DailyPlanController(service))
            .setControllerAdvice(new DailyPlanApiExceptionHandler()).build();
    }
    @Test void adjustsTodayItemDurationAndPriority() throws Exception {
        UUID itemId = UUID.randomUUID();
        when(service.adjustItem(eq(itemId), any())).thenReturn(response());
        mockMvc.perform(patch("/api/v1/daily-plan/today/items/{itemId}", itemId)
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"durationMinutes\":45,\"priority\":5,\"version\":0}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.date").value("2026-06-21"));
    }
    @Test void rejectsInvalidPriority() throws Exception {
        mockMvc.perform(patch("/api/v1/daily-plan/today/items/{itemId}", UUID.randomUUID())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"durationMinutes\":45,\"priority\":9,\"version\":0}"))
            .andExpect(status().isBadRequest());
    }
    private DailyPlanResponse response() {
        return new DailyPlanResponse(UUID.randomUUID(), LocalDate.of(2026, 6, 21), "Europe/Istanbul",
            UUID.randomUUID(), "Odak Günü", "ACTIVE", 0, Instant.parse("2026-06-21T00:00:00Z"),
            List.of(), List.of());
    }
}
