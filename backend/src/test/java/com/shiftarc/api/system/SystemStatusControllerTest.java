package com.shiftarc.api.system;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class SystemStatusControllerTest {

    private SystemStatusService systemStatusService;
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        systemStatusService = mock(SystemStatusService.class);
        mockMvc = MockMvcBuilders
            .standaloneSetup(new SystemStatusController(systemStatusService))
            .setControllerAdvice(new SystemApiExceptionHandler())
            .build();
    }

    @Test
    void returnsTheContractedSystemStatusResponse() throws Exception {
        when(systemStatusService.getStatus()).thenReturn(
            new SystemStatusResponse(
                "shiftarc-api",
                "0.1.0",
                SystemComponentStatus.UP,
                SystemComponentStatus.UP
            )
        );

        mockMvc.perform(get("/api/v1/system/status").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.service").value("shiftarc-api"))
            .andExpect(jsonPath("$.version").value("0.1.0"))
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.database").value("UP"));
    }

    @Test
    void returnsSafeProblemDetailsWhenTheDatabaseIsUnavailable() throws Exception {
        when(systemStatusService.getStatus()).thenThrow(
            new DatabaseUnavailableException("internal database detail")
        );

        mockMvc.perform(get("/api/v1/system/status").accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isServiceUnavailable())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.type").value("/problems/database-unavailable"))
            .andExpect(jsonPath("$.title").value("Database unavailable"))
            .andExpect(jsonPath("$.status").value(503))
            .andExpect(jsonPath("$.detail").value("The database is temporarily unavailable."))
            .andExpect(jsonPath("$.instance").value("/api/v1/system/status"))
            .andExpect(content().string(not(containsString("internal database detail"))));
    }
}
