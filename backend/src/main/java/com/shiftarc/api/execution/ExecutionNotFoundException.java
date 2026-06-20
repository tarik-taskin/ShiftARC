package com.shiftarc.api.execution;

class ExecutionNotFoundException extends RuntimeException {
    ExecutionNotFoundException(String message) { super(message); }
}
