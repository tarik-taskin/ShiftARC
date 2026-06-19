package com.shiftarc.api.daytype;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DayTypeServiceTest {

    @Mock
    private DayTypeRepository repository;

    private DayTypeService service;

    @BeforeEach
    void setUp() {
        service = new DayTypeService(repository);
    }

    @Test
    void createsANormalizedDayType() {
        when(repository.create(any(), any(), any())).thenReturn(dayType());

        service.create(new DayTypeCreateRequest("  İş   Günü ", "#8b7cff"));

        verify(repository).create(LocalWorkspace.ID, "İş Günü", "#8B7CFF");
    }

    @Test
    void rejectsATimelineWithAGap() {
        DayTypeBlocksUpdateRequest request = new DayTypeBlocksUpdateRequest(
            0,
            List.of(
                new DayTypeBlocksUpdateRequest.Block("Sabah", 0, 600, List.of()),
                new DayTypeBlocksUpdateRequest.Block("Akşam", 605, 1440, List.of())
            )
        );

        assertThatThrownBy(() -> service.replaceBlocks(UUID.randomUUID(), request))
            .isInstanceOf(DayTypeValidationException.class)
            .hasMessageContaining("contiguous");
    }

    @Test
    void rejectsArchivedOrForeignCategories() {
        UUID categoryId = UUID.randomUUID();
        when(repository.isActiveCategory(LocalWorkspace.ID, categoryId)).thenReturn(false);
        DayTypeBlocksUpdateRequest request = new DayTypeBlocksUpdateRequest(
            0,
            List.of(new DayTypeBlocksUpdateRequest.Block("Tüm gün", 0, 1440, List.of(categoryId)))
        );

        assertThatThrownBy(() -> service.replaceBlocks(UUID.randomUUID(), request))
            .isInstanceOf(DayTypeValidationException.class)
            .hasMessageContaining("active workspace categories");
    }

    private DayTypeResponse dayType() {
        Instant now = Instant.parse("2026-06-19T10:00:00Z");
        return new DayTypeResponse(
            UUID.randomUUID(),
            "İş Günü",
            "#8B7CFF",
            false,
            0,
            List.of(new DayTypeResponse.Block(UUID.randomUUID(), "Plansız", 0, 1440, List.of())),
            now,
            now
        );
    }
}
