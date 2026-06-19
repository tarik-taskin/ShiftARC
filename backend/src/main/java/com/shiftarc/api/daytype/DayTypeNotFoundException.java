package com.shiftarc.api.daytype;

class DayTypeNotFoundException extends RuntimeException {
    DayTypeNotFoundException() {
        super("The day type does not exist in the local workspace");
    }
}
