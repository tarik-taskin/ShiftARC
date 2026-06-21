package com.shiftarc.api.dailyplan;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.shiftarc.api.dailyplan.DailyPlanRepository.DayTypeSource;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlannedBlock;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlanningTask;
import com.shiftarc.api.dailyplan.DailyPlanRepository.SourceBlock;
import com.shiftarc.api.workspace.LocalWorkspace;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DailyPlanServiceTest {

    @Mock private DailyPlanRepository repository;

    @Test
    void allocatesDailyTargetsByPriorityIntoMatchingBlocks() {
        UUID category = UUID.randomUUID();
        UUID dayType = UUID.randomUUID();
        Clock clock = Clock.fixed(Instant.parse("2026-06-19T09:00:00Z"), ZoneOffset.UTC);
        DailyPlanService service = new DailyPlanService(repository, clock);
        when(repository.timezone(LocalWorkspace.ID)).thenReturn("UTC");
        when(repository.assignedDayType(LocalWorkspace.ID, LocalDate.of(2026, 6, 19))).thenReturn(new DayTypeSource(dayType, "İş Günü"));
        when(repository.sourceBlocks(dayType)).thenReturn(List.of(
            new SourceBlock(UUID.randomUUID(), "İş", 480, 1020, Set.of(category))
        ));
        when(repository.activeTasks(LocalWorkspace.ID)).thenReturn(List.of(
            new PlanningTask(UUID.randomUUID(), "WORK_ITEM", "Teslim", 5, 300, LocalDate.of(2026, 6, 28), null, 100, 0, Set.of(category)),
            new PlanningTask(UUID.randomUUID(), "HABIT", "İngilizce", 4, null, null, 360, 0, 60, Set.of(category))
        ));
        DailyPlanResponse response = response(dayType);
        when(repository.find(eq(LocalWorkspace.ID), any())).thenReturn(null, response);

        service.today();

        @SuppressWarnings("unchecked")
        ArgumentCaptor<List<PlannedBlock>> blocks = ArgumentCaptor.forClass(List.class);
        verify(repository).createPlan(any(), eq(LocalWorkspace.ID), eq(LocalDate.of(2026, 6, 19)), eq("UTC"), any(), blocks.capture(), any());
        org.assertj.core.api.Assertions.assertThat(blocks.getValue().get(0).items())
            .extracting(item -> item.endMinute() - item.startMinute())
            .containsExactly(20, 100);
    }

    private DailyPlanResponse response(UUID dayType) {
        return new DailyPlanResponse(UUID.randomUUID(), LocalDate.of(2026, 6, 19), "UTC", dayType,
            "İş Günü", "ACTIVE", 0, Instant.parse("2026-06-19T09:00:00Z"), List.of(), List.of());
    }
}
