package com.shiftarc.api.config;

import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class LocalDatabaseEnvironmentValidatorTest {

    private final ApplicationContextRunner contextRunner = new ApplicationContextRunner()
        .withInitializer(context -> context.getEnvironment().setActiveProfiles("local"))
        .withUserConfiguration(LocalDatabaseEnvironmentValidator.class);

    @Test
    void rejectsARequestToStartWithoutTheLocalDatabasePassword() {
        contextRunner
            .withPropertyValues("SHIFTARC_DB_PASSWORD=")
            .run(context -> {
                Throwable failure = context.getStartupFailure();
                assertTrue(failure != null);
                assertTrue(rootCause(failure).getMessage().contains(
                    "SHIFTARC_DB_PASSWORD must be configured"
                ));
            });
    }

    @Test
    void acceptsANonBlankLocalDatabasePassword() {
        contextRunner
            .withPropertyValues("SHIFTARC_DB_PASSWORD=test-only-password")
            .run(context -> assertNull(context.getStartupFailure()));
    }

    private Throwable rootCause(Throwable failure) {
        Throwable current = failure;
        while (current.getCause() != null) {
            current = current.getCause();
        }
        return current;
    }
}
