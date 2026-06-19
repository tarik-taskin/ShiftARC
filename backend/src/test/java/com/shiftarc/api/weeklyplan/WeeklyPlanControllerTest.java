package com.shiftarc.api.weeklyplan;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class WeeklyPlanControllerTest {

    private final WeeklyPlanService service = org.mockito.Mockito.mock(WeeklyPlanService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(new WeeklyPlanController(service))
            .setControllerAdvice(new WeeklyPlanApiExceptionHandler())
            .build();
    }

    @Test
    void returnsSevenWeekdaySlots() throws Exception {
        when(service.get()).thenReturn(emptyPlan());

        mockMvc.perform(get("/api/v1/weekly-plan"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.complete").value(false))
            .andExpect(jsonPath("$.days.length()").value(7));
    }

    @Test
    void validatesWeekdayBounds() throws Exception {
        mockMvc.perform(put("/api/v1/weekly-plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"version":0,"assignments":[{"dayOfWeek":8,"dayTypeId":"51000000-0000-0000-0000-000000000001"}]}
                    """))
            .andExpect(status().isBadRequest());
    }

    @Test
    void returnsTheSavedPlan() throws Exception {
        when(service.replace(any())).thenReturn(emptyPlan());

        mockMvc.perform(put("/api/v1/weekly-plan")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"version\":0,\"assignments\":[]}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.version").value(0));
    }

    private WeeklyPlanResponse emptyPlan() {
        return new WeeklyPlanResponse(
            0,
            false,
            java.util.stream.IntStream.rangeClosed(1, 7)
                .mapToObj(day -> new WeeklyPlanResponse.Day((short) day, null))
                .toList()
        );
    }
}
