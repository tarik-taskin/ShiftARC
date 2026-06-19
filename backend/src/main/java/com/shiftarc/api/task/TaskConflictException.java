package com.shiftarc.api.task;

class TaskConflictException extends RuntimeException {
    TaskConflictException(String message) {
        super(message);
    }
}
