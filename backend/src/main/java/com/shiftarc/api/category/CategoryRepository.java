package com.shiftarc.api.category;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CategoryRepository extends JpaRepository<CategoryEntity, UUID> {

    @Query("""
        SELECT category
        FROM CategoryEntity category
        WHERE category.workspaceId = :workspaceId
          AND (:includeArchived = true OR category.archived = false)
          AND (:search = '' OR lower(category.name) LIKE lower(concat('%', :search, '%')))
        ORDER BY category.archived ASC, lower(category.name) ASC
        """)
    List<CategoryEntity> findForWorkspace(
        @Param("workspaceId") UUID workspaceId,
        @Param("includeArchived") boolean includeArchived,
        @Param("search") String search
    );
}
