package com.shiftarc.api.category;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.mockito.Mockito.times;

import java.util.List;
import java.util.Optional;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.dao.DataIntegrityViolationException;

@ExtendWith(MockitoExtension.class)
class CategoryServiceTest {

    @Mock
    private CategoryRepository repository;

    private CategoryService service;

    @BeforeEach
    void setUp() {
        service = new CategoryService(repository);
    }

    @Test
    void normalizesAndCreatesACategory() {
        when(repository.saveAndFlush(any(CategoryEntity.class)))
            .thenAnswer(invocation -> invocation.getArgument(0));

        CategoryResponse response = service.create(
            new CategoryCreateRequest("  Yapay   Zeka  ", "#a78bfa", " brain ")
        );

        assertEquals("Yapay Zeka", response.name());
        assertEquals("#A78BFA", response.color());
        assertEquals("brain", response.icon());
        assertEquals(0, response.version());
    }

    @Test
    void listsWorkspaceCategoriesUsingSearchAndArchiveFilters() {
        CategoryEntity category = new CategoryEntity(
            LocalWorkspace.ID,
            "Ders",
            "#3B82F6",
            "graduation-cap"
        );
        when(repository.findForWorkspace(LocalWorkspace.ID, true, "der"))
            .thenReturn(List.of(category));

        List<CategoryResponse> response = service.list(true, "  der ");

        assertEquals(1, response.size());
        assertEquals("Ders", response.get(0).name());
    }

    @Test
    void rejectsStaleUpdatesAndDuplicateNames() {
        CategoryEntity category = new CategoryEntity(
            LocalWorkspace.ID,
            "Ders",
            "#3B82F6",
            null
        );
        when(repository.findById(category.id())).thenReturn(Optional.of(category));

        assertThrows(
            CategoryConflictException.class,
            () -> service.update(
                category.id(),
                new CategoryUpdateRequest("Eğitim", "#3B82F6", null, 2)
            )
        );

        when(repository.saveAndFlush(any(CategoryEntity.class)))
            .thenThrow(new DataIntegrityViolationException("duplicate"));
        assertThrows(
            CategoryConflictException.class,
            () -> service.create(new CategoryCreateRequest("Ders", "#3B82F6", null))
        );
    }

    @Test
    void archivesAndRestoresWithoutDeletingTheCategory() {
        CategoryEntity category = new CategoryEntity(
            LocalWorkspace.ID,
            "Dinlenme",
            "#8B5CF6",
            "armchair"
        );
        when(repository.findById(category.id())).thenReturn(Optional.of(category));
        when(repository.saveAndFlush(category)).thenReturn(category);

        service.archive(category.id(), 0);
        assertEquals(true, category.archived());
        service.restore(category.id(), 0);
        assertEquals(false, category.archived());
        verify(repository, times(2)).saveAndFlush(category);
    }
}
