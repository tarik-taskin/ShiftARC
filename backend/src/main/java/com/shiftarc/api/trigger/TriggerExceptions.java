package com.shiftarc.api.trigger;

class TriggerNotFoundException extends RuntimeException {
    TriggerNotFoundException() { super("Trigger not found"); }
}

class TriggerConflictException extends RuntimeException {
    TriggerConflictException(String message) { super(message); }
}

class TriggerValidationException extends RuntimeException {
    TriggerValidationException(String message) { super(message); }
}
