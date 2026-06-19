package com.shiftarc.api.weeklyplan;

import java.util.List;
import java.util.UUID;

public record WeeklyPlanResponse(
    long version,
    boolean complete,
    List<Day> days
) {
    public record Day(
        short dayOfWeek,
        DayType dayType
    ) {
    }

    public record DayType(
        UUID id,
        String name,
        String color,
        boolean archived,
        int blockCount
    ) {
    }
}
