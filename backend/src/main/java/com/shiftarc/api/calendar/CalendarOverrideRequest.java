package com.shiftarc.api.calendar;

import java.util.UUID;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

public record CalendarOverrideRequest(@NotNull UUID dayTypeId, @PositiveOrZero Long version) {}
