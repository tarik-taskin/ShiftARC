package com.shiftarc.api.calendar;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class CalendarOverrideControllerTest {
    private final CalendarOverrideService service = org.mockito.Mockito.mock(CalendarOverrideService.class);
    private MockMvc mockMvc;
    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new CalendarOverrideController(service))
            .setControllerAdvice(new CalendarOverrideApiExceptionHandler()).build();
    }
    @Test void savesDateSpecificDayType() throws Exception {
        LocalDate date = LocalDate.of(2026, 7, 10); UUID dayType = UUID.randomUUID();
        when(service.save(eq(date), any())).thenReturn(new CalendarOverrideResponse(date, dayType, "Tatil", "#22C55E", 0));
        mockMvc.perform(put("/api/v1/calendar/overrides/{date}", date)
            .contentType(MediaType.APPLICATION_JSON).content("{\"dayTypeId\":\"" + dayType + "\",\"version\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.dayTypeName").value("Tatil"));
    }
}
