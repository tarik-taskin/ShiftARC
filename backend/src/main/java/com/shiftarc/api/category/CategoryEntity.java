package com.shiftarc.api.category;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "category", schema = "shiftarc")
class CategoryEntity {

    @Id
    private UUID id;

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(nullable = false, length = 80)
    private String name;

    @Column(nullable = false, length = 7)
    private String color;

    @Column(length = 64)
    private String icon;

    @Column(nullable = false)
    private boolean archived;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected CategoryEntity() {
    }

    CategoryEntity(UUID workspaceId, String name, String color, String icon) {
        this.id = UUID.randomUUID();
        this.workspaceId = workspaceId;
        this.name = name;
        this.color = color;
        this.icon = icon;
        this.archived = false;
        this.version = 0;
        this.createdAt = Instant.now();
        this.updatedAt = this.createdAt;
    }

    UUID id() {
        return id;
    }

    UUID workspaceId() {
        return workspaceId;
    }

    String name() {
        return name;
    }

    String color() {
        return color;
    }

    String icon() {
        return icon;
    }

    boolean archived() {
        return archived;
    }

    long version() {
        return version;
    }

    void update(String name, String color, String icon) {
        this.name = name;
        this.color = color;
        this.icon = icon;
        this.updatedAt = Instant.now();
    }

    void archive() {
        this.archived = true;
        this.updatedAt = Instant.now();
    }

    void restore() {
        this.archived = false;
        this.updatedAt = Instant.now();
    }
}
