package com.shiftarc.api.workspace;

import java.util.Arrays;

enum SupportedTheme {
    ARC_MIDNIGHT("arc-midnight"),
    DAWN("dawn"),
    AURORA("aurora");

    private final String id;

    SupportedTheme(String id) {
        this.id = id;
    }

    String id() {
        return id;
    }

    static boolean contains(String candidate) {
        return Arrays.stream(values()).anyMatch(theme -> theme.id.equals(candidate));
    }
}
