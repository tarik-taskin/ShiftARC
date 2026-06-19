package com.shiftarc.api.weeklyplan;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.ArgumentMatchers.eq;

import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class WeeklyPlanServiceTest {

    @Mock
    private WeeklyPlanRepository repository;

    private WeeklyPlanService service;

    @BeforeEach
    void setUp() {
        service = new WeeklyPlanService(repository);
    }

    @Test
    void rejectsDuplicateWeekdays() {
        UUID dayType = UUID.randomUUID();
        when(repository.isActiveDayType(LocalWorkspace.ID, dayType)).thenReturn(true);
        WeeklyPlanUpdateRequest request = new WeeklyPlanUpdateRequest(
            0,
            List.of(
                new WeeklyPlanUpdateRequest.Assignment((short) 1, dayType),
                new WeeklyPlanUpdateRequest.Assignment((short) 1, dayType)
            )
        );

        assertThatThrownBy(() -> service.replace(request))
            .isInstanceOf(WeeklyPlanValidationException.class)
            .hasMessageContaining("only be assigned once");
    }

    @Test
    void rejectsArchivedOrForeignDayTypes() {
        UUID dayType = UUID.randomUUID();
        when(repository.isActiveDayType(LocalWorkspace.ID, dayType)).thenReturn(false);

        assertThatThrownBy(() -> service.replace(new WeeklyPlanUpdateRequest(
            2,
            List.of(new WeeklyPlanUpdateRequest.Assignment((short) 4, dayType))
        )))
            .isInstanceOf(WeeklyPlanValidationException.class)
            .hasMessageContaining("active day types");
    }

    @Test
    void ordersAssignmentsBeforeAtomicReplacement() {
        UUID first = UUID.randomUUID();
        UUID last = UUID.randomUUID();
        when(repository.isActiveDayType(LocalWorkspace.ID, first)).thenReturn(true);
        when(repository.isActiveDayType(LocalWorkspace.ID, last)).thenReturn(true);

        service.replace(new WeeklyPlanUpdateRequest(
            3,
            List.of(
                new WeeklyPlanUpdateRequest.Assignment((short) 7, last),
                new WeeklyPlanUpdateRequest.Assignment((short) 1, first)
            )
        ));

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<WeeklyPlanUpdateRequest.Assignment>> captor = ArgumentCaptor.forClass(List.class);
        verify(repository).replace(eq(LocalWorkspace.ID), eq(3L), captor.capture());
        org.assertj.core.api.Assertions.assertThat(captor.getValue())
            .extracting(WeeklyPlanUpdateRequest.Assignment::dayOfWeek)
            .containsExactly((short) 1, (short) 7);
    }
}
