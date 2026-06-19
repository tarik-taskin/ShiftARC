package com.shiftarc.api.task;

class TaskValidationException extends RuntimeException {
    TaskValidationException(String message) {
        super(message);
    }
}
