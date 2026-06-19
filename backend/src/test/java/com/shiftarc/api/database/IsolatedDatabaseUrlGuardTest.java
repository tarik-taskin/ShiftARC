package com.shiftarc.api.database;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class IsolatedDatabaseUrlGuardTest {

    @Test
    void acceptsLoopbackTestAndE2eDatabases() {
        assertEquals(
            "shiftarc_test",
            IsolatedDatabaseUrlGuard.requireIsolatedLocalDatabase(
                "jdbc:postgresql://localhost:5432/shiftarc_test"
            )
        );
        assertEquals(
            "shiftarc_e2e",
            IsolatedDatabaseUrlGuard.requireIsolatedLocalDatabase(
                "jdbc:postgresql://127.0.0.1:5432/shiftarc_e2e"
            )
        );
    }

    @Test
    void rejectsApplicationAndRemoteDatabases() {
        assertThrows(
            IllegalArgumentException.class,
            () -> IsolatedDatabaseUrlGuard.requireIsolatedLocalDatabase(
                "jdbc:postgresql://localhost:5432/shiftarc"
            )
        );
        assertThrows(
            IllegalArgumentException.class,
            () -> IsolatedDatabaseUrlGuard.requireIsolatedLocalDatabase(
                "jdbc:postgresql://database.internal:5432/shiftarc_test"
            )
        );
    }
}
