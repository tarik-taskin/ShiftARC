package com.shiftarc.api.task;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class TaskServiceTest {
    @Mock private TaskRepository repository;
    private TaskService service;

    @BeforeEach void setUp() { service = new TaskService(repository); }

    @Test
    void normalizesAndCreatesAWorkItem() {
        when(repository.create(any(), any())).thenReturn(null);
        TaskWriteRequest request = new TaskWriteRequest(
            TaskType.WORK_ITEM, "  ML   Dersi ", "  Model çalış ", (short) 5,
            300, LocalDate.now().plusDays(7), null, List.of(), null
        );

        service.create(request);

        org.mockito.ArgumentCaptor<TaskWriteRequest> captor = org.mockito.ArgumentCaptor.forClass(TaskWriteRequest.class);
        verify(repository).create(org.mockito.ArgumentMatchers.eq(LocalWorkspace.ID), captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue().title()).isEqualTo("ML Dersi");
    }

    @Test
    void rejectsWorkItemsWithoutDeadline() {
        TaskWriteRequest request = new TaskWriteRequest(
            TaskType.WORK_ITEM, "İş", null, (short) 3, 60, null, null, List.of(), null
        );
        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(TaskValidationException.class)
            .hasMessageContaining("deadline");
    }

    @Test
    void rejectsNonGridHabitTargets() {
        TaskWriteRequest request = new TaskWriteRequest(
            TaskType.HABIT, "İngilizce", null, (short) 4, null, null, 62, List.of(), null
        );
        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(TaskValidationException.class)
            .hasMessageContaining("five-minute");
    }

    @Test
    void rejectsForeignCategories() {
        UUID category = UUID.randomUUID();
        when(repository.isActiveCategory(LocalWorkspace.ID, category)).thenReturn(false);
        TaskWriteRequest request = new TaskWriteRequest(
            TaskType.HABIT, "İngilizce", null, (short) 4, null, null, 60, List.of(category), null
        );
        assertThatThrownBy(() -> service.create(request))
            .isInstanceOf(TaskValidationException.class)
            .hasMessageContaining("active workspace categories");
    }
}
