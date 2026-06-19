package com.shiftarc.api.daytype;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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

class DayTypeControllerTest {

    private final DayTypeService service = org.mockito.Mockito.mock(DayTypeService.class);
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders
            .standaloneSetup(new DayTypeController(service))
            .setControllerAdvice(new DayTypeApiExceptionHandler())
            .build();
    }

    @Test
    void createsADayType() throws Exception {
        DayTypeResponse response = response();
        when(service.create(any())).thenReturn(response);

        mockMvc.perform(post("/api/v1/day-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name":"İş Günü","color":"#8B7CFF"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("İş Günü"))
            .andExpect(jsonPath("$.blocks[0].endMinute").value(1440));
    }

    @Test
    void rejectsInvalidBlockBoundaries() throws Exception {
        mockMvc.perform(post("/api/v1/day-types")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"\",\"color\":\"violet\"}"))
            .andExpect(status().isBadRequest());
    }

    @Test
    void archivesWithTheClientVersion() throws Exception {
        UUID id = UUID.randomUUID();

        mockMvc.perform(delete("/api/v1/day-types/{id}", id).queryParam("version", "4"))
            .andExpect(status().isNoContent());

        verify(service).archive(id, 4);
    }

    private DayTypeResponse response() {
        Instant now = Instant.parse("2026-06-19T10:00:00Z");
        return new DayTypeResponse(
            UUID.randomUUID(), "İş Günü", "#8B7CFF", false, 0,
            List.of(new DayTypeResponse.Block(UUID.randomUUID(), "Plansız", 0, 1440, List.of())),
            now, now
        );
    }
}
