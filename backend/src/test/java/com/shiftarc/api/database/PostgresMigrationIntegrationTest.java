package com.shiftarc.api.database;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Statement;

import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.output.MigrateResult;
import org.junit.jupiter.api.Assumptions;
import org.junit.jupiter.api.Test;

class PostgresMigrationIntegrationTest {

    private static final String DEFAULT_TEST_URL =
        "jdbc:postgresql://localhost:5432/shiftarc_test";
    private static final String DEFAULT_USERNAME = "shiftarc_app";

    @Test
    void migratesTheIsolatedPostgresDatabaseFromEmptyToCurrent() throws SQLException {
        String password = System.getenv("SHIFTARC_DB_PASSWORD");
        Assumptions.assumeTrue(
            password != null && !password.isBlank(),
            "SHIFTARC_DB_PASSWORD is required for the PostgreSQL migration integration test"
        );

        String jdbcUrl = environmentOrDefault("SHIFTARC_TEST_DB_URL", DEFAULT_TEST_URL);
        String username = environmentOrDefault("SHIFTARC_DB_USERNAME", DEFAULT_USERNAME);
        assertEquals("shiftarc_test", IsolatedDatabaseUrlGuard.requireIsolatedLocalDatabase(jdbcUrl));

        resetIsolatedDatabase(jdbcUrl, username, password);

        Flyway flyway = Flyway.configure()
            .dataSource(jdbcUrl, username, password)
            .defaultSchema("public")
            .locations("classpath:db/migration")
            .validateMigrationNaming(true)
            .cleanDisabled(true)
            .load();
        MigrateResult result = flyway.migrate();

        assertTrue(result.success);
        assertEquals(6, result.migrationsExecuted);
        try (Connection connection = DriverManager.getConnection(jdbcUrl, username, password)) {
            assertEquals(21, queryCount(connection, """
                SELECT count(*)
                FROM information_schema.tables
                WHERE table_schema = 'shiftarc'
                """));
            assertEquals(1, queryCount(connection, "SELECT count(*) FROM shiftarc.workspace"));
            assertEquals(
                1,
                queryCount(connection, "SELECT count(*) FROM shiftarc.workspace_settings")
            );
            assertEquals(1, queryCount(connection, "SELECT count(*) FROM shiftarc.pomodoro_settings"));
            assertExecutionHistoryConstraints(connection);
        }
    }

    private void assertExecutionHistoryConstraints(Connection connection) throws SQLException {
        try (Statement statement = connection.createStatement()) {
            statement.executeUpdate("""
                INSERT INTO shiftarc.task (
                    id, workspace_id, task_type, title, importance,
                    total_required_minutes, deadline
                ) VALUES (
                    '10000000-0000-0000-0000-000000000001',
                    '00000000-0000-0000-0000-000000000001',
                    'WORK_ITEM', 'Migration test task', 3, 30, current_date + 1
                )
                """);
            statement.executeUpdate("""
                INSERT INTO shiftarc.task_execution_session (
                    id, workspace_id, task_id, started_at
                ) VALUES (
                    '20000000-0000-0000-0000-000000000001',
                    '00000000-0000-0000-0000-000000000001',
                    '10000000-0000-0000-0000-000000000001',
                    current_timestamp
                )
                """);
            assertThrows(SQLException.class, () -> statement.executeUpdate("""
                INSERT INTO shiftarc.task_execution_session (
                    id, workspace_id, task_id, started_at
                ) VALUES (
                    '20000000-0000-0000-0000-000000000002',
                    '00000000-0000-0000-0000-000000000001',
                    '10000000-0000-0000-0000-000000000001',
                    current_timestamp
                )
                """));
            statement.executeUpdate("""
                INSERT INTO shiftarc.task_execution_event (
                    id, workspace_id, session_id, event_type, occurred_at
                ) VALUES (
                    '30000000-0000-0000-0000-000000000001',
                    '00000000-0000-0000-0000-000000000001',
                    '20000000-0000-0000-0000-000000000001',
                    'STARTED', current_timestamp
                )
                """);
            assertThrows(SQLException.class, () -> statement.executeUpdate("""
                UPDATE shiftarc.task_execution_event
                SET payload = '{"changed": true}'::jsonb
                WHERE id = '30000000-0000-0000-0000-000000000001'
                """));
        }
    }

    private void resetIsolatedDatabase(String jdbcUrl, String username, String password)
        throws SQLException {
        try (
            Connection connection = DriverManager.getConnection(jdbcUrl, username, password);
            Statement statement = connection.createStatement()
        ) {
            statement.execute("DROP SCHEMA IF EXISTS shiftarc CASCADE");
            statement.execute("DROP TABLE IF EXISTS public.flyway_schema_history");
        }
    }

    private int queryCount(Connection connection, String sql) throws SQLException {
        try (
            Statement statement = connection.createStatement();
            ResultSet resultSet = statement.executeQuery(sql)
        ) {
            resultSet.next();
            return resultSet.getInt(1);
        }
    }

    private String environmentOrDefault(String name, String defaultValue) {
        String value = System.getenv(name);
        return value == null || value.isBlank() ? defaultValue : value;
    }
}
