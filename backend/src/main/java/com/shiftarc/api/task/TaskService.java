package com.shiftarc.api.task;

import java.util.HashSet;
import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TaskService {

    private final TaskRepository repository;

    TaskService(TaskRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<TaskResponse> list(
        TaskType type,
        TaskStatus status,
        UUID categoryId,
        String search,
        TaskSort sort
    ) {
        return repository.findAll(
            LocalWorkspace.ID,
            type,
            status,
            categoryId,
            search == null ? "" : search.strip(),
            sort
        );
    }

    @Transactional
    public TaskResponse create(TaskWriteRequest request) {
        TaskWriteRequest normalized = normalizeAndValidate(request, false);
        return repository.create(LocalWorkspace.ID, normalized);
    }

    @Transactional
    public TaskResponse update(UUID id, TaskWriteRequest request) {
        TaskWriteRequest normalized = normalizeAndValidate(request, true);
        return repository.update(LocalWorkspace.ID, id, normalized);
    }

    @Transactional
    public TaskResponse setStatus(UUID id, TaskStatus status, long version) {
        return repository.setStatus(LocalWorkspace.ID, id, status, version);
    }

    private TaskWriteRequest normalizeAndValidate(TaskWriteRequest request, boolean update) {
        if (update && request.version() == null) {
            throw new TaskValidationException("Task version is required when updating");
        }
        if (request.type() == TaskType.WORK_ITEM) {
            validateMinutes(request.totalRequiredMinutes(), "Total required time");
            if (request.deadline() == null || request.weeklyTargetMinutes() != null) {
                throw new TaskValidationException("Work items require a deadline and total time only");
            }
        } else if (request.type() == TaskType.HABIT) {
            validateMinutes(request.weeklyTargetMinutes(), "Weekly target time");
            if (request.deadline() != null || request.totalRequiredMinutes() != null) {
                throw new TaskValidationException("Habits require a weekly target only");
            }
        } else if (request.deadline() != null || request.totalRequiredMinutes() != null || request.weeklyTargetMinutes() != null) {
            throw new TaskValidationException("Opportunities cannot have deadlines or required target time");
        }
        if (request.dailyLimitMinutes() != null) {
            validateMinutes(request.dailyLimitMinutes(), "Daily limit");
        }
        for (UUID categoryId : new HashSet<>(request.categoryIds())) {
            if (!repository.isActiveCategory(LocalWorkspace.ID, categoryId)) {
                throw new TaskValidationException("Tasks can only use active workspace categories");
            }
        }
        String description = request.description() == null || request.description().isBlank()
            ? null
            : request.description().strip();
        return new TaskWriteRequest(
            request.type(),
            request.title().strip().replaceAll("\\s+", " "),
            description,
            request.importance(),
            request.totalRequiredMinutes(),
            request.deadline(),
            request.weeklyTargetMinutes(),
            request.dailyLimitMinutes(),
            request.stages().stream()
                .map(stage -> new TaskWriteRequest.Stage(stage.title().strip().replaceAll("\\s+", " "), stage.completed()))
                .filter(stage -> !stage.title().isBlank())
                .distinct()
                .toList(),
            request.categoryIds().stream().distinct().toList(),
            request.version()
        );
    }

    private void validateMinutes(Integer value, String label) {
        if (value == null || value <= 0 || value % 5 != 0) {
            throw new TaskValidationException(label + " must be a positive five-minute multiple");
        }
    }
}
