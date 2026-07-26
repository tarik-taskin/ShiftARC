package com.shiftarc.api.task;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

public record TaskResponse(
    UUID id,
    TaskType type,
    String title,
    String description,
    short importance,
    TaskStatus status,
    Integer totalRequiredMinutes,
    LocalDate deadline,
    Integer weeklyTargetMinutes,
    Integer dailyLimitMinutes,
    int executedMinutes,
    int remainingMinutes,
    List<Category> categories,
    List<Stage> stages,
    long version,
    Instant completedAt,
    Instant createdAt,
    Instant updatedAt
) {
    public record Category(UUID id, String name, String color, String icon, boolean archived) {
    }

    public record Stage(UUID id, String title, int position, boolean completed) {
    }
}
