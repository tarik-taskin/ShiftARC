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

        assertEquals(1, migrations.length);
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
}
