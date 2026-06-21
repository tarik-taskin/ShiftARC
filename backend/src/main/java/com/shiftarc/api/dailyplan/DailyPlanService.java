package com.shiftarc.api.dailyplan;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.shiftarc.api.dailyplan.DailyPlanRepository.DayTypeSource;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlannedBlock;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlannedItem;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlannedWarning;
import com.shiftarc.api.dailyplan.DailyPlanRepository.PlanningTask;
import com.shiftarc.api.dailyplan.DailyPlanRepository.SourceBlock;
import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.beans.factory.annotation.Autowired;

@Service
public class DailyPlanService {

    private final DailyPlanRepository repository;
    private final Clock clock;

    @Autowired
    DailyPlanService(DailyPlanRepository repository) {
        this(repository, Clock.systemUTC());
    }

    DailyPlanService(DailyPlanRepository repository, Clock clock) {
        this.repository = repository;
        this.clock = clock;
    }

    @Transactional
    public DailyPlanResponse today() {
        PlanContext context = context();
        DailyPlanResponse existing = repository.find(LocalWorkspace.ID, context.date());
        if (existing != null) return existing;
        GeneratedStructure generated = generate(context);
        UUID planId = UUID.randomUUID();
        repository.createPlan(
            planId, LocalWorkspace.ID, context.date(), context.timezone(), context.dayType(),
            generated.blocks(), generated.warnings()
        );
        return repository.find(LocalWorkspace.ID, context.date());
    }

    @Transactional
    public DailyPlanResponse regenerate(long version) {
        PlanContext context = context();
        DailyPlanResponse existing = repository.find(LocalWorkspace.ID, context.date());
        if (existing == null) return today();
        GeneratedStructure generated = generate(context);
        repository.replacePlan(
            existing.id(), LocalWorkspace.ID, version, context.timezone(), context.dayType(),
            generated.blocks(), generated.warnings()
        );
        return repository.find(LocalWorkspace.ID, context.date());
    }

    @Transactional(readOnly = true)
    public DailyPlanResponse findSnapshot(LocalDate date) {
        return repository.find(LocalWorkspace.ID, date);
    }

    @Transactional
    public DailyPlanResponse adjustItem(UUID itemId, DailyPlanItemAdjustmentRequest request) {
        if (request.durationMinutes() % 5 != 0) {
            throw new DailyPlanValidationException("Duration must use five-minute increments");
        }
        String timezone = repository.timezone(LocalWorkspace.ID);
        LocalDate date = LocalDate.now(clock.withZone(ZoneId.of(timezone)));
        DailyPlanResponse plan = repository.find(LocalWorkspace.ID, date);
        if (plan == null) throw new DailyPlanUnavailableException("Today's daily plan has not been generated");
        repository.adjustItem(LocalWorkspace.ID, date, itemId, request);
        return repository.find(LocalWorkspace.ID, date);
    }

    private PlanContext context() {
        String timezone = repository.timezone(LocalWorkspace.ID);
        LocalDate date = LocalDate.now(clock.withZone(ZoneId.of(timezone)));
        DayTypeSource dayType = repository.assignedDayType(LocalWorkspace.ID, date);
        return new PlanContext(date, timezone, dayType);
    }

    private GeneratedStructure generate(PlanContext context) {
        List<SourceBlock> sourceBlocks = repository.sourceBlocks(context.dayType().id());
        List<PlanningTask> tasks = repository.activeTasks(LocalWorkspace.ID);
        Map<UUID, Integer> remaining = new HashMap<>();
        for (PlanningTask task : tasks) remaining.put(task.id(), requestedMinutes(task, context.date()));

        List<PlannedBlock> blocks = new ArrayList<>();
        for (SourceBlock source : sourceBlocks) {
            int cursor = source.startMinute();
            List<PlannedItem> items = new ArrayList<>();
            for (PlanningTask task : tasks) {
                int taskRemaining = remaining.get(task.id());
                if (taskRemaining <= 0 || !matches(task.categoryIds(), source.categoryIds())) continue;
                int allocation = Math.min(taskRemaining, source.endMinute() - cursor);
                allocation -= allocation % 5;
                if (allocation < 5) continue;
                items.add(new PlannedItem(UUID.randomUUID(), task.id(), task.title(), cursor, cursor + allocation));
                cursor += allocation;
                remaining.put(task.id(), taskRemaining - allocation);
                if (cursor >= source.endMinute()) break;
            }
            blocks.add(new PlannedBlock(
                UUID.randomUUID(), source.id(), source.name(), source.startMinute(), source.endMinute(), List.copyOf(items)
            ));
        }

        List<PlannedWarning> warnings = tasks.stream()
            .filter(task -> remaining.get(task.id()) > 0)
            .map(task -> new PlannedWarning(
                task.id(), "INSUFFICIENT_MATCHING_CAPACITY", remaining.get(task.id()),
                task.title() + " için kategori uyumlu zaman bloklarında yeterli kapasite yok."
            ))
            .toList();
        return new GeneratedStructure(List.copyOf(blocks), warnings);
    }

    private int requestedMinutes(PlanningTask task, LocalDate date) {
        int divisor;
        int total;
        if (task.type().equals("WORK_ITEM")) {
            long days = task.deadline() == null ? 1 : ChronoUnit.DAYS.between(date, task.deadline()) + 1;
            divisor = (int) Math.max(1, days);
            total = Math.max(0, task.totalMinutes() - task.executedTotalMinutes());
        } else {
            divisor = 8 - date.getDayOfWeek().getValue();
            total = Math.max(0, task.weeklyMinutes() - task.executedWeekMinutes());
        }
        return roundUpFive((int) Math.ceil((double) total / divisor));
    }

    private boolean matches(Set<UUID> taskCategories, Set<UUID> blockCategories) {
        return taskCategories.stream().anyMatch(blockCategories::contains);
    }

    private int roundUpFive(int minutes) {
        return ((minutes + 4) / 5) * 5;
    }

    private record PlanContext(LocalDate date, String timezone, DayTypeSource dayType) {}
    private record GeneratedStructure(List<PlannedBlock> blocks, List<PlannedWarning> warnings) {}
}
