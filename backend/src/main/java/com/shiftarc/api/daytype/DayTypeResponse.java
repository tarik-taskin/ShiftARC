package com.shiftarc.api.daytype;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record DayTypeResponse(
    UUID id,
    String name,
    String color,
    boolean archived,
    long version,
    List<Block> blocks,
    Instant createdAt,
    Instant updatedAt
) {
    public record Block(
        UUID id,
        String name,
        int startMinute,
        int endMinute,
        List<UUID> categoryIds
    ) {
    }
}
