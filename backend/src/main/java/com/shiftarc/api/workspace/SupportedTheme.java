package com.shiftarc.api.workspace;

import java.util.Arrays;

enum SupportedTheme {
    AMBER("amber"), ION("ion"), GROVE("grove");

    private final String id;

    SupportedTheme(String id) {
        this.id = id;
    }

    String id() {
        return id;
    }

    static String normalize(String id) {
        return switch (id) {
            case "arc-midnight", "dawn" -> "amber";
            case "aurora" -> "ion";
            default -> id;
        };
    }

    static boolean contains(String candidate) {
        return Arrays.stream(values()).anyMatch(theme -> theme.id.equals(normalize(candidate)));
    }
}
