package com.shiftarc.api.system;

import java.util.Objects;

import org.springframework.boot.info.BuildProperties;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
class SystemStatusService {

    private static final String DATABASE_PROBE_QUERY = "SELECT 1";

    private final JdbcTemplate jdbcTemplate;
    private final BuildProperties buildProperties;

    SystemStatusService(JdbcTemplate jdbcTemplate, BuildProperties buildProperties) {
        this.jdbcTemplate = jdbcTemplate;
        this.buildProperties = buildProperties;
    }

    SystemStatusResponse getStatus() {
        assertDatabaseIsAvailable();

        return new SystemStatusResponse(
            buildProperties.getName(),
            buildProperties.getVersion(),
            SystemComponentStatus.UP,
            SystemComponentStatus.UP
        );
    }

    private void assertDatabaseIsAvailable() {
        try {
            Integer result = jdbcTemplate.queryForObject(DATABASE_PROBE_QUERY, Integer.class);
            if (!Objects.equals(result, 1)) {
                throw new DatabaseUnavailableException("Database health check returned an unexpected result");
            }
        }
        catch (DataAccessException exception) {
            throw new DatabaseUnavailableException(exception);
        }
    }
}
