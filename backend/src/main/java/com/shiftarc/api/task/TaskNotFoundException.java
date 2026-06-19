package com.shiftarc.api.task;

class TaskNotFoundException extends RuntimeException {
    TaskNotFoundException() {
        super("The task does not exist in the local workspace");
    }
}
