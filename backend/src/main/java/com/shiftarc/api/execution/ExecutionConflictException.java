package com.shiftarc.api.execution;

class ExecutionConflictException extends RuntimeException {
    ExecutionConflictException(String message) { super(message); }
}
