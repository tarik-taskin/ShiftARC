package com.shiftarc.api.workspace;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class WorkspaceServiceTest {

    private WorkspaceRepository workspaceRepository;
    private WorkspaceSettingsRepository settingsRepository;
    private SampleWorkspaceDataSeeder sampleDataSeeder;
    private WorkspaceEntity workspace;
    private WorkspaceSettingsEntity settings;
    private WorkspaceService service;

    @BeforeEach
    void setUp() {
        workspaceRepository = mock(WorkspaceRepository.class);
        settingsRepository = mock(WorkspaceSettingsRepository.class);
        sampleDataSeeder = mock(SampleWorkspaceDataSeeder.class);
        workspace = mock(WorkspaceEntity.class);
        settings = mock(WorkspaceSettingsEntity.class);
        when(workspaceRepository.findById(LocalWorkspace.ID)).thenReturn(Optional.of(workspace));
        when(settingsRepository.findById(LocalWorkspace.ID)).thenReturn(Optional.of(settings));
        when(settingsRepository.saveAndFlush(settings)).thenReturn(settings);
        when(workspace.id()).thenReturn(LocalWorkspace.ID);
        when(workspace.name()).thenReturn("Lokal Çalışma Alanı");
        when(settings.timezone()).thenReturn("Europe/Istanbul");
        when(settings.weekStartsOn()).thenReturn((short) 1);
        when(settings.themeId()).thenReturn("amber");
        when(settings.backgroundMode()).thenReturn(BackgroundMode.TIME_AWARE);
        when(settings.version()).thenReturn(0L);
        service = new WorkspaceService(
            workspaceRepository,
            settingsRepository,
            sampleDataSeeder
        );
    }

    @Test
    void returnsTheLocalWorkspacePreferences() {
        WorkspaceResponse response = service.getLocalWorkspace();

        assertEquals(LocalWorkspace.ID, response.id());
        assertEquals("Europe/Istanbul", response.timezone());
        assertEquals("amber", response.themeId());
        assertEquals(BackgroundMode.TIME_AWARE, response.backgroundMode());
    }

    @Test
    void completesOnboardingAndSeedsOptionalSampleData() {
        OnboardingRequest request = new OnboardingRequest(
            "Europe/Istanbul",
            "aurora",
            BackgroundMode.STATIC,
            true,
            0, null, null
        );

        service.completeOnboarding(request);

        verify(sampleDataSeeder).seed(LocalWorkspace.ID);
        verify(settings).updatePreferences(
            "Europe/Istanbul",
            "aurora",
            BackgroundMode.STATIC,
            true, ColorMode.LIGHT, ClockStyle.DIGITAL
        );
        verify(settingsRepository).saveAndFlush(settings);
    }

    @Test
    void preservesAbsentNewPreferencesForOlderClients() {
        service.updateSettings(new WorkspaceSettingsUpdateRequest(
            "Europe/Istanbul", "dawn", BackgroundMode.STATIC, 0, null, null));
        verify(settings).updatePreferences("Europe/Istanbul", "dawn", BackgroundMode.STATIC,
            false, null, null);
    }

    @Test
    void savesExplicitAppearancePreferences() {
        service.updateSettings(new WorkspaceSettingsUpdateRequest(
            "Europe/Istanbul", "grove", BackgroundMode.STATIC, 0, ColorMode.DARK, ClockStyle.DIAL));
        verify(settings).updatePreferences("Europe/Istanbul", "grove", BackgroundMode.STATIC,
            false, ColorMode.DARK, ClockStyle.DIAL);
    }

    @Test
    void normalizesLegacyThemesWithoutLosingNewPreferences() {
        WorkspaceSettingsEntity entity = new WorkspaceSettingsEntity();
        entity.updatePreferences("Europe/Istanbul", "aurora", BackgroundMode.STATIC,
            false, ColorMode.DARK, ClockStyle.SEGMENT);
        entity.updatePreferences("Europe/Istanbul", "dawn", BackgroundMode.STATIC,
            false, null, null);
        assertEquals("amber", entity.themeId());
        assertEquals(ColorMode.DARK, entity.colorMode());
        assertEquals(ClockStyle.SEGMENT, entity.clockStyle());
    }

    @Test
    void rejectsStaleAndInvalidPreferenceUpdates() {
        WorkspaceSettingsUpdateRequest stale = new WorkspaceSettingsUpdateRequest(
            "Europe/Istanbul",
            "dawn",
            BackgroundMode.TIME_AWARE,
            4, null, null
        );
        assertThrows(WorkspaceConflictException.class, () -> service.updateSettings(stale));
        verify(settingsRepository, never()).saveAndFlush(settings);

        WorkspaceSettingsUpdateRequest invalidTimezone = new WorkspaceSettingsUpdateRequest(
            "Mars/Olympus",
            "dawn",
            BackgroundMode.TIME_AWARE,
            0, null, null
        );
        assertThrows(
            InvalidWorkspacePreferenceException.class,
            () -> service.updateSettings(invalidTimezone)
        );
    }
}
