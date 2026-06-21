package com.shiftarc.api.calendar;

class CalendarOverrideNotFoundException extends RuntimeException {
    CalendarOverrideNotFoundException() { super("Calendar day override not found"); }
}
class CalendarOverrideConflictException extends RuntimeException {
    CalendarOverrideConflictException(String message) { super(message); }
}
class CalendarOverrideValidationException extends RuntimeException {
    CalendarOverrideValidationException(String message) { super(message); }
}
