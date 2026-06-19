package com.shiftarc.api.system;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.boot.info.BuildProperties;
import org.springframework.dao.DataAccessResourceFailureException;
import org.springframework.jdbc.core.JdbcTemplate;

@ExtendWith(MockitoExtension.class)
class SystemStatusServiceTest {

    @Mock
    private JdbcTemplate jdbcTemplate;

    @Mock
    private BuildProperties buildProperties;

    private SystemStatusService systemStatusService;

    @BeforeEach
    void setUp() {
        systemStatusService = new SystemStatusService(jdbcTemplate, buildProperties);
    }

    @Test
    void returnsApiAndDatabaseStatusWhenProbeSucceeds() {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(1);
        when(buildProperties.getName()).thenReturn("shiftarc-api");
        when(buildProperties.getVersion()).thenReturn("0.1.0");

        SystemStatusResponse response = systemStatusService.getStatus();

        assertEquals("shiftarc-api", response.service());
        assertEquals("0.1.0", response.version());
        assertEquals(SystemComponentStatus.UP, response.status());
        assertEquals(SystemComponentStatus.UP, response.database());
    }

    @Test
    void wrapsDatabaseAccessFailuresWithoutExposingJdbcDetails() {
        DataAccessResourceFailureException databaseFailure =
            new DataAccessResourceFailureException("connection refused");
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenThrow(databaseFailure);

        DatabaseUnavailableException exception = assertThrows(
            DatabaseUnavailableException.class,
            systemStatusService::getStatus
        );

        assertEquals("Database health check failed", exception.getMessage());
        assertSame(databaseFailure, exception.getCause());
    }

    @Test
    void rejectsUnexpectedProbeResults() {
        when(jdbcTemplate.queryForObject("SELECT 1", Integer.class)).thenReturn(0);

        DatabaseUnavailableException exception = assertThrows(
            DatabaseUnavailableException.class,
            systemStatusService::getStatus
        );

        assertEquals("Database health check returned an unexpected result", exception.getMessage());
    }
}
