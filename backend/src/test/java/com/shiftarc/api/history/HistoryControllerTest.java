package com.shiftarc.api.history;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class HistoryControllerTest {
    private final HistoryService service = org.mockito.Mockito.mock(HistoryService.class);
    private MockMvc mockMvc;
    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new HistoryController(service))
            .setControllerAdvice(new HistoryApiExceptionHandler()).build();
    }
    @Test void listsCalendarDays() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 20);
        when(service.days(date, date)).thenReturn(List.of(new HistoryResponse.Day(
            date, UUID.randomUUID(), "İş Günü", "ACTIVE", 180, 90, 1, 2, 2)));
        mockMvc.perform(get("/api/v1/history").param("from", date.toString()).param("to", date.toString()))
            .andExpect(status().isOk()).andExpect(jsonPath("$[0].executedMinutes").value(90));
    }
    @Test void returnsMissingSnapshotAsProblemDetails() throws Exception {
        LocalDate date = LocalDate.of(2026, 6, 1);
        when(service.detail(date)).thenThrow(new HistoryNotFoundException());
        mockMvc.perform(get("/api/v1/history/{date}", date))
            .andExpect(status().isNotFound()).andExpect(jsonPath("$.title").value("History request failed"));
    }
}
