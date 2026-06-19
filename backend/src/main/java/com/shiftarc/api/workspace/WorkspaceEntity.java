package com.shiftarc.api.workspace;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "workspace", schema = "shiftarc")
class WorkspaceEntity {

    @Id
    private UUID id;

    @Column(nullable = false, length = 64)
    private String slug;

    @Column(nullable = false, length = 120)
    private String name;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected WorkspaceEntity() {
    }

    UUID id() {
        return id;
    }

    String name() {
        return name;
    }
}
