package com.shiftarc.api.task;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
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

class TaskControllerTest {
    private final TaskService service = org.mockito.Mockito.mock(TaskService.class);
    private MockMvc mockMvc;

    @BeforeEach void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new TaskController(service))
            .setControllerAdvice(new TaskApiExceptionHandler()).build();
    }

    @Test
    void createsAWorkItem() throws Exception {
        when(service.create(any())).thenReturn(response());
        mockMvc.perform(post("/api/v1/tasks").contentType(MediaType.APPLICATION_JSON).content("""
            {"type":"WORK_ITEM","title":"ML Dersi","importance":5,"totalRequiredMinutes":300,
             "deadline":"2026-07-01","weeklyTargetMinutes":null,"dailyLimitMinutes":null,
             "stages":[],"categoryIds":[]}
            """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.type").value("WORK_ITEM"))
            .andExpect(jsonPath("$.title").value("ML Dersi"));
    }

    @Test
    void validatesImportance() throws Exception {
        mockMvc.perform(post("/api/v1/tasks").contentType(MediaType.APPLICATION_JSON).content("""
            {"type":"HABIT","title":"İngilizce","importance":8,"weeklyTargetMinutes":60,
             "dailyLimitMinutes":null,"stages":[],"categoryIds":[]}
            """))
            .andExpect(status().isBadRequest());
    }

    private TaskResponse response() {
        Instant now = Instant.parse("2026-06-19T10:00:00Z");
        return new TaskResponse(UUID.randomUUID(), TaskType.WORK_ITEM, "ML Dersi", null, (short) 5,
            TaskStatus.ACTIVE, 300, LocalDate.of(2026, 7, 1), null, null, 0, 300,
            List.of(), List.of(), 0, null, now, now);
    }
}
