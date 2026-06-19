package com.shiftarc.api.category;

import java.util.UUID;

public record CategoryResponse(
    UUID id,
    String name,
    String color,
    String icon,
    boolean archived,
    long version
) {
    static CategoryResponse from(CategoryEntity category) {
        return new CategoryResponse(
            category.id(),
            category.name(),
            category.color(),
            category.icon(),
            category.archived(),
            category.version()
        );
    }
}
