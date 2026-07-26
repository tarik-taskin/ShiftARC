package com.shiftarc.api.daytype;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.shiftarc.api.workspace.LocalWorkspace;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class DayTypeService {

    private final DayTypeRepository repository;

    DayTypeService(DayTypeRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<DayTypeResponse> list(boolean includeArchived) {
        return repository.findAll(LocalWorkspace.ID, includeArchived);
    }

    @Transactional
    public DayTypeResponse create(DayTypeCreateRequest request) {
        return translateConflict(() -> repository.create(
            LocalWorkspace.ID,
            normalizeName(request.name()),
            request.color().toUpperCase()
        ));
    }

    @Transactional
    public DayTypeResponse update(UUID id, DayTypeUpdateRequest request) {
        return translateConflict(() -> repository.update(
            LocalWorkspace.ID,
            id,
            normalizeName(request.name()),
            request.color().toUpperCase(),
            request.version()
        ));
    }

    @Transactional
    public void archive(UUID id, long version) {
        repository.setArchived(LocalWorkspace.ID, id, true, version);
    }

    @Transactional
    public DayTypeResponse restore(UUID id, long version) {
        return translateConflict(() -> {
            repository.setArchived(LocalWorkspace.ID, id, false, version);
            return repository.find(LocalWorkspace.ID, id);
        });
    }

    @Transactional
    public DayTypeResponse duplicate(UUID id) {
        DayTypeResponse source = repository.find(LocalWorkspace.ID, id);
        String baseName = source.name() + " kopya";
        String candidate = baseName;
        int suffix = 2;
        while (repository.activeNameExists(LocalWorkspace.ID, candidate)) {
            candidate = baseName + " " + suffix;
            suffix++;
        }
        return repository.duplicate(LocalWorkspace.ID, id, candidate, source.color());
    }

    @Transactional
    public DayTypeResponse replaceBlocks(UUID id, DayTypeBlocksUpdateRequest request) {
        validateTimeline(request.blocks());
        List<DayTypeBlocksUpdateRequest.Block> normalized = request.blocks().stream()
            .map(block -> new DayTypeBlocksUpdateRequest.Block(
                normalizeName(block.name()),
                block.startMinute(),
                block.endMinute(),
                block.categoryIds().stream().distinct().toList()
            ))
            .toList();
        return repository.replaceBlocks(LocalWorkspace.ID, id, request.version(), normalized);
    }

    private void validateTimeline(List<DayTypeBlocksUpdateRequest.Block> blocks) {
        int expectedStart = 0;
        Set<UUID> checkedCategories = new HashSet<>();
        for (DayTypeBlocksUpdateRequest.Block block : blocks) {
            if (block.startMinute() != expectedStart || block.endMinute() <= block.startMinute()) {
                throw new DayTypeValidationException(
                    "Time blocks must be ordered, contiguous, and cover the whole day"
                );
            }
            if (block.startMinute() % 5 != 0 || block.endMinute() % 5 != 0) {
                throw new DayTypeValidationException("Time blocks must use five-minute boundaries");
            }
            for (UUID categoryId : block.categoryIds()) {
                if (checkedCategories.add(categoryId)
                    && !repository.isActiveCategory(LocalWorkspace.ID, categoryId)) {
                    throw new DayTypeValidationException(
                        "Time blocks can only use active workspace categories"
                    );
                }
            }
            expectedStart = block.endMinute();
        }
        if (expectedStart != 1440) {
            throw new DayTypeValidationException("Time blocks must cover 00:00 through 24:00");
        }
    }

    private <T> T translateConflict(Action<T> action) {
        try {
            return action.run();
        }
        catch (DataIntegrityViolationException exception) {
            throw new DayTypeConflictException("An active day type with this name already exists");
        }
    }

    private String normalizeName(String name) {
        return name.strip().replaceAll("\\s+", " ");
    }

    @FunctionalInterface
    private interface Action<T> {
        T run();
    }
}
