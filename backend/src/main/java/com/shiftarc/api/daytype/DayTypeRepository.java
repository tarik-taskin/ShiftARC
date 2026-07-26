package com.shiftarc.api.daytype;

import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Repository;

@Repository
class DayTypeRepository {

    private final JdbcTemplate jdbcTemplate;

    DayTypeRepository(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    List<DayTypeResponse> findAll(UUID workspaceId, boolean includeArchived) {
        return jdbcTemplate.query(
            """
            SELECT id, name, color, archived, version, created_at, updated_at
            FROM shiftarc.day_type
            WHERE workspace_id = ? AND (? OR archived = false)
            ORDER BY archived, lower(name)
            """,
            (resultSet, rowNumber) -> mapDayType(resultSet),
            workspaceId,
            includeArchived
        );
    }

    DayTypeResponse find(UUID workspaceId, UUID id) {
        List<DayTypeResponse> results = jdbcTemplate.query(
            """
            SELECT id, name, color, archived, version, created_at, updated_at
            FROM shiftarc.day_type
            WHERE workspace_id = ? AND id = ?
            """,
            (resultSet, rowNumber) -> mapDayType(resultSet),
            workspaceId,
            id
        );
        if (results.isEmpty()) {
            throw new DayTypeNotFoundException();
        }
        return results.get(0);
    }

    DayTypeResponse create(UUID workspaceId, String name, String color) {
        UUID id = UUID.randomUUID();
        UUID blockId = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO shiftarc.day_type (id, workspace_id, name, color) VALUES (?, ?, ?, ?)",
            id,
            workspaceId,
            name,
            color
        );
        jdbcTemplate.update(
            """
            INSERT INTO shiftarc.day_type_block
                (id, day_type_id, name, start_minute, end_minute, position)
            VALUES (?, ?, 'Plansız', 0, 1440, 0)
            """,
            blockId,
            id
        );
        return find(workspaceId, id);
    }

    DayTypeResponse update(
        UUID workspaceId,
        UUID id,
        String name,
        String color,
        long version
    ) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.day_type
            SET name = ?, color = ?, version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """,
            name,
            color,
            workspaceId,
            id,
            version
        );
        requireChanged(workspaceId, id, changed);
        return find(workspaceId, id);
    }

    DayTypeResponse duplicate(UUID workspaceId, UUID sourceId, String name, String color) {
        UUID id = UUID.randomUUID();
        jdbcTemplate.update(
            "INSERT INTO shiftarc.day_type (id, workspace_id, name, color) VALUES (?, ?, ?, ?)",
            id,
            workspaceId,
            name,
            color
        );
        List<DayTypeResponse.Block> blocks = findBlocks(sourceId);
        for (int position = 0; position < blocks.size(); position++) {
            DayTypeResponse.Block block = blocks.get(position);
            UUID blockId = UUID.randomUUID();
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.day_type_block
                    (id, day_type_id, name, start_minute, end_minute, position)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                blockId,
                id,
                block.name(),
                block.startMinute(),
                block.endMinute(),
                position
            );
            for (UUID categoryId : block.categoryIds()) {
                jdbcTemplate.update(
                    "INSERT INTO shiftarc.day_type_block_category (day_type_block_id, category_id) VALUES (?, ?)",
                    blockId,
                    categoryId
                );
            }
        }
        return find(workspaceId, id);
    }

    boolean activeNameExists(UUID workspaceId, String name) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT count(*) FROM shiftarc.day_type
            WHERE workspace_id = ? AND archived = false AND lower(btrim(name)) = lower(btrim(?))
            """,
            Integer.class,
            workspaceId,
            name
        );
        return count != null && count > 0;
    }

    void setArchived(UUID workspaceId, UUID id, boolean archived, long version) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.day_type
            SET archived = ?, version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND version = ?
            """,
            archived,
            workspaceId,
            id,
            version
        );
        requireChanged(workspaceId, id, changed);
    }

    DayTypeResponse replaceBlocks(
        UUID workspaceId,
        UUID id,
        long version,
        List<DayTypeBlocksUpdateRequest.Block> blocks
    ) {
        int changed = jdbcTemplate.update(
            """
            UPDATE shiftarc.day_type
            SET version = version + 1, updated_at = current_timestamp
            WHERE workspace_id = ? AND id = ? AND archived = false AND version = ?
            """,
            workspaceId,
            id,
            version
        );
        requireChanged(workspaceId, id, changed);
        jdbcTemplate.update("DELETE FROM shiftarc.day_type_block WHERE day_type_id = ?", id);
        for (int position = 0; position < blocks.size(); position++) {
            DayTypeBlocksUpdateRequest.Block block = blocks.get(position);
            UUID blockId = UUID.randomUUID();
            jdbcTemplate.update(
                """
                INSERT INTO shiftarc.day_type_block
                    (id, day_type_id, name, start_minute, end_minute, position)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                blockId,
                id,
                block.name(),
                block.startMinute(),
                block.endMinute(),
                position
            );
            for (UUID categoryId : block.categoryIds().stream().distinct().toList()) {
                jdbcTemplate.update(
                    """
                    INSERT INTO shiftarc.day_type_block_category (day_type_block_id, category_id)
                    VALUES (?, ?)
                    """,
                    blockId,
                    categoryId
                );
            }
        }
        return find(workspaceId, id);
    }

    boolean isActiveCategory(UUID workspaceId, UUID categoryId) {
        Integer count = jdbcTemplate.queryForObject(
            """
            SELECT count(*) FROM shiftarc.category
            WHERE workspace_id = ? AND id = ? AND archived = false
            """,
            Integer.class,
            workspaceId,
            categoryId
        );
        return count != null && count == 1;
    }

    private DayTypeResponse mapDayType(ResultSet resultSet) throws SQLException {
        UUID id = resultSet.getObject("id", UUID.class);
        return new DayTypeResponse(
            id,
            resultSet.getString("name"),
            resultSet.getString("color"),
            resultSet.getBoolean("archived"),
            resultSet.getLong("version"),
            findBlocks(id),
            instant(resultSet, "created_at"),
            instant(resultSet, "updated_at")
        );
    }

    private List<DayTypeResponse.Block> findBlocks(UUID dayTypeId) {
        return jdbcTemplate.query(
            """
            SELECT block.id, block.name, block.start_minute, block.end_minute,
                   category.category_id
            FROM shiftarc.day_type_block block
            LEFT JOIN shiftarc.day_type_block_category category
                ON category.day_type_block_id = block.id
            WHERE block.day_type_id = ?
            ORDER BY block.position, category.category_id
            """,
            resultSet -> {
                List<DayTypeResponse.Block> blocks = new ArrayList<>();
                UUID currentId = null;
                String name = null;
                int start = 0;
                int end = 0;
                List<UUID> categoryIds = new ArrayList<>();
                while (resultSet.next()) {
                    UUID blockId = resultSet.getObject("id", UUID.class);
                    if (currentId != null && !currentId.equals(blockId)) {
                        blocks.add(new DayTypeResponse.Block(currentId, name, start, end, List.copyOf(categoryIds)));
                        categoryIds.clear();
                    }
                    currentId = blockId;
                    name = resultSet.getString("name");
                    start = resultSet.getInt("start_minute");
                    end = resultSet.getInt("end_minute");
                    UUID categoryId = resultSet.getObject("category_id", UUID.class);
                    if (categoryId != null) {
                        categoryIds.add(categoryId);
                    }
                }
                if (currentId != null) {
                    blocks.add(new DayTypeResponse.Block(currentId, name, start, end, List.copyOf(categoryIds)));
                }
                return blocks;
            },
            dayTypeId
        );
    }

    private void requireChanged(UUID workspaceId, UUID id, int changed) {
        if (changed == 1) {
            return;
        }
        Integer exists = jdbcTemplate.queryForObject(
            "SELECT count(*) FROM shiftarc.day_type WHERE workspace_id = ? AND id = ?",
            Integer.class,
            workspaceId,
            id
        );
        if (exists == null || exists == 0) {
            throw new DayTypeNotFoundException();
        }
        throw new DayTypeConflictException("Day type is stale; refresh before saving");
    }

    private Instant instant(ResultSet resultSet, String column) throws SQLException {
        Timestamp timestamp = resultSet.getTimestamp(column);
        return timestamp.toInstant();
    }
}
