package com.shiftarc.api.trigger;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class TriggerControllerTest {
    private final TriggerService service = org.mockito.Mockito.mock(TriggerService.class);
    private MockMvc mockMvc;

    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TriggerController(service))
            .setControllerAdvice(new TriggerApiExceptionHandler()).build();
    }

    @Test void createsAnIntervalHabitTrigger() throws Exception {
        when(service.create(any())).thenReturn(new TriggerResponse(UUID.randomUUID(), TriggerType.HABIT,
            TriggerScheduleType.INTERVAL, "Odayı havalandır", null, 4, 5, 120, null, 0,
            Instant.parse("2026-06-20T10:00:00Z"), TriggerStatus.ACTIVE, List.of(), List.of(), 0));
        mockMvc.perform(post("/api/v1/triggers").contentType(MediaType.APPLICATION_JSON).content("""
            {"type":"HABIT","scheduleType":"INTERVAL","title":"Odayı havalandır",
             "importance":4,"durationMinutes":5,"intervalMinutes":120,
             "occurrenceTarget":null,"categoryIds":[],"dayTypeIds":[]}
            """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.scheduleType").value("INTERVAL"))
            .andExpect(jsonPath("$.durationMinutes").value(5));
    }

    @Test void rejectsInvalidDuration() throws Exception {
        mockMvc.perform(post("/api/v1/triggers").contentType(MediaType.APPLICATION_JSON).content("""
            {"type":"HABIT","scheduleType":"INTERVAL","title":"Ara ver",
             "importance":3,"durationMinutes":0,"intervalMinutes":120,
             "categoryIds":[],"dayTypeIds":[]}
            """))
            .andExpect(status().isBadRequest());
    }
}
