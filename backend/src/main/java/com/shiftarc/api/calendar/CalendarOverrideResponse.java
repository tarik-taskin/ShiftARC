package com.shiftarc.api.calendar;

import java.time.LocalDate;
import java.util.UUID;

public record CalendarOverrideResponse(
    LocalDate date,
    UUID dayTypeId,
    String dayTypeName,
    String dayTypeColor,
    long version
) {}
