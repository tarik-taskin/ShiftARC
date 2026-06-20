package com.shiftarc.api.trigger;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
class TriggerService {
    private final TriggerRepository repository;

    TriggerService(TriggerRepository repository) { this.repository = repository; }

    @Transactional(readOnly = true)
    List<TriggerResponse> list(boolean includeArchived) {
        return repository.list(LocalWorkspace.ID, includeArchived);
    }

    @Transactional
    TriggerResponse create(TriggerWriteRequest request) {
        return repository.create(LocalWorkspace.ID, validate(request, false));
    }

    @Transactional
    TriggerResponse update(UUID id, TriggerWriteRequest request) {
        return repository.update(LocalWorkspace.ID, id, validate(request, true));
    }

    @Transactional
    TriggerResponse complete(UUID id, long version) {
        return repository.complete(LocalWorkspace.ID, id, version);
    }

    @Transactional
    TriggerResponse setStatus(UUID id, TriggerStatus status, long version) {
        return repository.setStatus(LocalWorkspace.ID, id, status, version);
    }

    private TriggerWriteRequest validate(TriggerWriteRequest request, boolean update) {
        if (update && request.version() == null) throw new TriggerValidationException("Trigger version is required");
        if (request.durationMinutes() % 5 != 0) throw new TriggerValidationException("Duration must use five-minute increments");
        if (request.scheduleType() == TriggerScheduleType.INTERVAL
            && (request.intervalMinutes() == null || request.intervalMinutes() < 30)) {
            throw new TriggerValidationException("Interval triggers require at least 30 minutes");
        }
        if (request.scheduleType() == TriggerScheduleType.AFTER_CATEGORY
            && (request.intervalMinutes() != null || request.categoryIds().isEmpty())) {
            throw new TriggerValidationException("Category triggers require a category and no interval");
        }
        if (request.type() == TriggerType.WORK_ITEM
            && (request.occurrenceTarget() == null || request.occurrenceTarget() < 1)) {
            throw new TriggerValidationException("Work item triggers require an occurrence target");
        }
        if (request.type() == TriggerType.HABIT && request.occurrenceTarget() != null) {
            throw new TriggerValidationException("Habit triggers cannot have an occurrence target");
        }
        for (UUID id : new HashSet<>(request.categoryIds())) {
            if (!repository.activeCategory(LocalWorkspace.ID, id)) {
                throw new TriggerValidationException("Triggers can only use active workspace categories");
            }
        }
        return new TriggerWriteRequest(request.type(), request.scheduleType(),
            request.title().strip().replaceAll("\\s+", " "),
            request.description() == null || request.description().isBlank() ? null : request.description().strip(),
            request.importance(), request.durationMinutes(), request.intervalMinutes(), request.occurrenceTarget(),
            request.categoryIds().stream().distinct().toList(), request.version());
    }
}
