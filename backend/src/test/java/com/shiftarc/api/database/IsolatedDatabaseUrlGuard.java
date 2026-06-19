package com.shiftarc.api.database;

import java.net.URI;
import java.util.Set;

final class IsolatedDatabaseUrlGuard {

    private static final String JDBC_PREFIX = "jdbc:";
    private static final Set<String> LOOPBACK_HOSTS = Set.of("localhost", "127.0.0.1", "[::1]", "::1");
    private static final Set<String> ALLOWED_SUFFIXES = Set.of("_test", "_e2e");

    private IsolatedDatabaseUrlGuard() {
    }

    static String requireIsolatedLocalDatabase(String jdbcUrl) {
        if (jdbcUrl == null || !jdbcUrl.startsWith("jdbc:postgresql://")) {
            throw new IllegalArgumentException("An explicit PostgreSQL JDBC URL is required");
        }

        URI uri = URI.create(jdbcUrl.substring(JDBC_PREFIX.length()));
        if (!LOOPBACK_HOSTS.contains(uri.getHost())) {
            throw new IllegalArgumentException("Test databases must use a loopback host");
        }

        String path = uri.getPath();
        String databaseName = path == null || !path.startsWith("/")
            ? ""
            : path.substring(1);
        if (databaseName.isBlank() || databaseName.contains("/")) {
            throw new IllegalArgumentException("Test database name is missing or invalid");
        }

        boolean isolated = ALLOWED_SUFFIXES.stream().anyMatch(databaseName::endsWith);
        if (!isolated) {
            throw new IllegalArgumentException(
                "Test database name must end with _test or _e2e"
            );
        }

        return databaseName;
    }
}
