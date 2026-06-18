package com.shiftarc.api.system;

final class DatabaseUnavailableException extends RuntimeException {

    DatabaseUnavailableException(Throwable cause) {
        super("Database health check failed", cause);
    }

    DatabaseUnavailableException(String message) {
        super(message);
    }
}
