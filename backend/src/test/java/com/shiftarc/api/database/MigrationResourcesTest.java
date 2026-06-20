package com.shiftarc.api.database;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.regex.Pattern;

import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;

class MigrationResourcesTest {

    private static final Pattern VERSIONED_MIGRATION_NAME = Pattern.compile(
        "^V[1-9][0-9]*__[a-z0-9_]+\\.sql$"
    );

    @Test
    void includesOnlyWellNamedVersionedMigrations() throws IOException {
        Resource[] migrations = new PathMatchingResourcePatternResolver()
            .getResources("classpath*:db/migration/*.sql");

        assertEquals(4, migrations.length);
        for (Resource migration : migrations) {
            assertTrue(VERSIONED_MIGRATION_NAME.matcher(migration.getFilename()).matches());
        }
    }

    @Test
    void initializesOnlyTheApplicationOwnedSchema() throws IOException {
        Resource migration = new PathMatchingResourcePatternResolver()
            .getResource("classpath:db/migration/V1__initialize_database.sql");
        String sql = migration.getContentAsString(StandardCharsets.UTF_8);

        assertTrue(sql.contains("CREATE SCHEMA IF NOT EXISTS shiftarc"));
        assertTrue(sql.contains("AUTHORIZATION CURRENT_USER"));
        assertFalse(sql.toLowerCase().contains("create table"));
    }

    @Test
    void definesTheCoreDomainAndAppendOnlyExecutionHistory() throws IOException {
        String coreDomain = migrationSql("V2__create_core_planning_domain.sql");
        String executionHistory = migrationSql(
            "V3__create_daily_plan_and_execution_history.sql"
        );

        assertTrue(coreDomain.contains("CREATE TABLE shiftarc.workspace"));
        assertTrue(coreDomain.contains("CREATE TABLE shiftarc.day_type_block"));
        assertTrue(coreDomain.contains("CREATE TABLE shiftarc.task"));
        assertTrue(coreDomain.contains("day_type_block_five_minute_grid"));
        assertTrue(coreDomain.contains("task_type_fields_valid"));
        assertTrue(executionHistory.contains("CREATE TABLE shiftarc.daily_plan"));
        assertTrue(executionHistory.contains("CREATE TABLE shiftarc.task_execution_session"));
        assertTrue(executionHistory.contains("task_execution_single_active_session"));
        assertTrue(executionHistory.contains("task_execution_event_append_only"));
        assertTrue(migrationSql("V4__create_trigger_domain.sql").contains("CREATE TABLE shiftarc.trigger_rule"));
    }

    private String migrationSql(String filename) throws IOException {
        Resource migration = new PathMatchingResourcePatternResolver()
            .getResource("classpath:db/migration/" + filename);
        return migration.getContentAsString(StandardCharsets.UTF_8);
    }
}
