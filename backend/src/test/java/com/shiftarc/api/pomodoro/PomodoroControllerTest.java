package com.shiftarc.api.pomodoro;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class PomodoroControllerTest {
    private final PomodoroService service = org.mockito.Mockito.mock(PomodoroService.class);
    private MockMvc mockMvc;
    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new PomodoroController(service))
            .setControllerAdvice(new PomodoroApiExceptionHandler()).build();
    }
    @Test void startsFocusSession() throws Exception {
        when(service.start(any())).thenReturn(new PomodoroStateResponse(
            new PomodoroStateResponse.Settings(25, 5, 15, 4, 0), null, List.of(), 0));
        mockMvc.perform(post("/api/v1/pomodoro/start").contentType(MediaType.APPLICATION_JSON)
            .content("{\"phase\":\"FOCUS\",\"taskId\":null}"))
            .andExpect(status().isOk()).andExpect(jsonPath("$.settings.focusMinutes").value(25));
    }
    @Test void requiresPhase() throws Exception {
        mockMvc.perform(post("/api/v1/pomodoro/start").contentType(MediaType.APPLICATION_JSON)
            .content("{\"taskId\":null}"))
            .andExpect(status().isBadRequest());
    }
}
