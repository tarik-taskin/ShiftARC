package com.shiftarc.api.workspace;

import java.time.DateTimeException;
import java.time.ZoneId;

import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class WorkspaceService {

    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceSettingsRepository settingsRepository;
    private final SampleWorkspaceDataSeeder sampleDataSeeder;

    WorkspaceService(
        WorkspaceRepository workspaceRepository,
        WorkspaceSettingsRepository settingsRepository,
        SampleWorkspaceDataSeeder sampleDataSeeder
    ) {
        this.workspaceRepository = workspaceRepository;
        this.settingsRepository = settingsRepository;
        this.sampleDataSeeder = sampleDataSeeder;
    }

    @Transactional(readOnly = true)
    public WorkspaceResponse getLocalWorkspace() {
        WorkspaceEntity workspace = workspaceRepository
            .findById(LocalWorkspace.ID)
            .orElseThrow(WorkspaceNotFoundException::new);
        WorkspaceSettingsEntity settings = settingsRepository
            .findById(LocalWorkspace.ID)
            .orElseThrow(WorkspaceNotFoundException::new);
        return toResponse(workspace, settings);
    }

    @Transactional
    public WorkspaceResponse updateSettings(WorkspaceSettingsUpdateRequest request) {
        validatePreferences(request.timezone(), request.themeId());
        WorkspaceEntity workspace = requireWorkspace();
        WorkspaceSettingsEntity settings = requireSettings();
        requireVersion(settings, request.version());
        settings.updatePreferences(
            request.timezone(),
            request.themeId(),
            request.backgroundMode(),
            false
        );
        return save(workspace, settings);
    }

    @Transactional
    public WorkspaceResponse completeOnboarding(OnboardingRequest request) {
        validatePreferences(request.timezone(), request.themeId());
        WorkspaceEntity workspace = requireWorkspace();
        WorkspaceSettingsEntity settings = requireSettings();
        requireVersion(settings, request.version());
        if (settings.onboardingCompleted()) {
            throw new WorkspaceConflictException("Onboarding has already been completed");
        }
        if (request.includeSampleData()) {
            sampleDataSeeder.seed(workspace.id());
        }
        settings.updatePreferences(
            request.timezone(),
            request.themeId(),
            request.backgroundMode(),
            true
        );
        return save(workspace, settings);
    }

    private WorkspaceResponse save(
        WorkspaceEntity workspace,
        WorkspaceSettingsEntity settings
    ) {
        try {
            WorkspaceSettingsEntity saved = settingsRepository.saveAndFlush(settings);
            return toResponse(workspace, saved);
        }
        catch (OptimisticLockingFailureException exception) {
            throw new WorkspaceConflictException(
                "Workspace settings were changed by another request"
            );
        }
    }

    private void validatePreferences(String timezone, String themeId) {
        try {
            ZoneId.of(timezone);
        }
        catch (DateTimeException exception) {
            throw new InvalidWorkspacePreferenceException("Timezone is not a valid IANA zone");
        }
        if (!SupportedTheme.contains(themeId)) {
            throw new InvalidWorkspacePreferenceException("Theme is not supported");
        }
    }

    private void requireVersion(WorkspaceSettingsEntity settings, long requestedVersion) {
        if (settings.version() != requestedVersion) {
            throw new WorkspaceConflictException(
                "Workspace settings are stale; refresh before saving"
            );
        }
    }

    private WorkspaceEntity requireWorkspace() {
        return workspaceRepository
            .findById(LocalWorkspace.ID)
            .orElseThrow(WorkspaceNotFoundException::new);
    }

    private WorkspaceSettingsEntity requireSettings() {
        return settingsRepository
            .findById(LocalWorkspace.ID)
            .orElseThrow(WorkspaceNotFoundException::new);
    }

    private WorkspaceResponse toResponse(
        WorkspaceEntity workspace,
        WorkspaceSettingsEntity settings
    ) {
        return new WorkspaceResponse(
            workspace.id(),
            workspace.name(),
            settings.timezone(),
            settings.weekStartsOn(),
            settings.themeId(),
            settings.backgroundMode(),
            settings.onboardingCompleted(),
            settings.version()
        );
    }
}
