package com.shiftarc.api.workspace;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;

@Entity
@Table(name = "workspace_settings", schema = "shiftarc")
class WorkspaceSettingsEntity {

    @Id
    @Column(name = "workspace_id")
    private UUID workspaceId;

    @Column(nullable = false, length = 64)
    private String timezone;

    @Column(name = "week_starts_on", nullable = false)
    private short weekStartsOn;

    @Column(name = "theme_id", nullable = false, length = 64)
    private String themeId;

    @Column(name = "background_mode", nullable = false, length = 24)
    private String backgroundMode;

    @Column(name = "onboarding_completed", nullable = false)
    private boolean onboardingCompleted;

    @Version
    @Column(nullable = false)
    private long version;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected WorkspaceSettingsEntity() {
    }

    UUID workspaceId() {
        return workspaceId;
    }

    String timezone() {
        return timezone;
    }

    short weekStartsOn() {
        return weekStartsOn;
    }

    String themeId() {
        return themeId;
    }

    BackgroundMode backgroundMode() {
        return BackgroundMode.valueOf(backgroundMode);
    }

    boolean onboardingCompleted() {
        return onboardingCompleted;
    }

    long version() {
        return version;
    }

    void updatePreferences(
        String timezone,
        String themeId,
        BackgroundMode backgroundMode,
        boolean completeOnboarding
    ) {
        this.timezone = timezone;
        this.themeId = themeId;
        this.backgroundMode = backgroundMode.name();
        if (completeOnboarding) {
            this.onboardingCompleted = true;
        }
        this.updatedAt = Instant.now();
    }
}
