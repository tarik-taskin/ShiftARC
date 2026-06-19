package com.shiftarc.api.workspace;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

public interface WorkspaceSettingsRepository extends JpaRepository<WorkspaceSettingsEntity, UUID> {
}
