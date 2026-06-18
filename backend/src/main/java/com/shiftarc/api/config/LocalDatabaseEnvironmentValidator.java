package com.shiftarc.api.config;

import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.BeanInitializationException;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.core.env.Environment;
import org.springframework.util.StringUtils;

@Configuration(proxyBeanMethods = false)
@Profile("local")
class LocalDatabaseEnvironmentValidator {

    private final Environment environment;

    LocalDatabaseEnvironmentValidator(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void validateDatabasePassword() {
        if (!StringUtils.hasText(environment.getProperty("SHIFTARC_DB_PASSWORD"))) {
            throw new BeanInitializationException(
                "SHIFTARC_DB_PASSWORD must be configured before starting the local profile"
            );
        }
    }
}
