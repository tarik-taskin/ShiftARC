package com.shiftarc.api.category;

import java.util.List;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.OptimisticLockingFailureException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final JdbcTemplate jdbcTemplate;

    CategoryService(CategoryRepository categoryRepository, JdbcTemplate jdbcTemplate) {
        this.categoryRepository = categoryRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list(boolean includeArchived, String search) {
        String normalizedSearch = search == null ? "" : search.strip();
        return categoryRepository
            .findForWorkspace(LocalWorkspace.ID, includeArchived, normalizedSearch)
            .stream()
            .map(CategoryResponse::from)
            .toList();
    }

    @Transactional
    public CategoryResponse create(CategoryCreateRequest request) {
        CategoryEntity category = new CategoryEntity(
            LocalWorkspace.ID,
            normalizeName(request.name()),
            request.color().toUpperCase(),
            normalizeIcon(request.icon())
        );
        return save(category);
    }

    @Transactional
    public CategoryResponse update(UUID id, CategoryUpdateRequest request) {
        CategoryEntity category = requireCategory(id);
        requireVersion(category, request.version());
        category.update(
            normalizeName(request.name()),
            request.color().toUpperCase(),
            normalizeIcon(request.icon())
        );
        return save(category);
    }

    @Transactional
    public void archive(UUID id, long version) {
        CategoryEntity category = requireCategory(id);
        requireVersion(category, version);
        if (category.archived()) {
            return;
        }
        unlinkActivePlanningReferences(id);
        category.archive();
        save(category);
    }

    @Transactional
    public CategoryResponse restore(UUID id, long version) {
        CategoryEntity category = requireCategory(id);
        requireVersion(category, version);
        if (!category.archived()) {
            return CategoryResponse.from(category);
        }
        category.restore();
        return save(category);
    }

    private CategoryResponse save(CategoryEntity category) {
        try {
            return CategoryResponse.from(categoryRepository.saveAndFlush(category));
        }
        catch (DataIntegrityViolationException exception) {
            throw new CategoryConflictException(
                "An active category with this name already exists"
            );
        }
        catch (OptimisticLockingFailureException exception) {
            throw new CategoryConflictException(
                "Category was changed by another request; refresh before saving"
            );
        }
    }

    private CategoryEntity requireCategory(UUID id) {
        return categoryRepository
            .findById(id)
            .filter(category -> category.workspaceId().equals(LocalWorkspace.ID))
            .orElseThrow(CategoryNotFoundException::new);
    }

    private void requireVersion(CategoryEntity category, long version) {
        if (category.version() != version) {
            throw new CategoryConflictException(
                "Category is stale; refresh before saving"
            );
        }
    }

    private String normalizeName(String name) {
        return name.strip().replaceAll("\\s+", " ");
    }

    private String normalizeIcon(String icon) {
        return icon == null || icon.isBlank() ? null : icon.strip();
    }

    private void unlinkActivePlanningReferences(UUID categoryId) {
        jdbcTemplate.update("DELETE FROM shiftarc.task_category WHERE category_id = ?", categoryId);
        jdbcTemplate.update("DELETE FROM shiftarc.day_type_block_category WHERE category_id = ?", categoryId);
        jdbcTemplate.update("DELETE FROM shiftarc.trigger_rule_category WHERE category_id = ?", categoryId);
    }
}
