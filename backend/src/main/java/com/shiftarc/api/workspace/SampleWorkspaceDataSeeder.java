package com.shiftarc.api.workspace;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Component;

@Component
class SampleWorkspaceDataSeeder {

    private static final UUID SLEEP = uuid("01000000-0000-0000-0000-000000000001");
    private static final UUID SELF_CARE = uuid("01000000-0000-0000-0000-000000000002");
    private static final UUID WORK = uuid("01000000-0000-0000-0000-000000000003");
    private static final UUID REST = uuid("01000000-0000-0000-0000-000000000004");
    private static final UUID SPORT = uuid("01000000-0000-0000-0000-000000000005");
    private static final UUID STUDY = uuid("01000000-0000-0000-0000-000000000006");
    private static final UUID WORK_DAY = uuid("02000000-0000-0000-0000-000000000001");
    private static final UUID REST_DAY = uuid("02000000-0000-0000-0000-000000000002");

    private final JdbcClient jdbcClient;

    SampleWorkspaceDataSeeder(JdbcClient jdbcClient) {
        this.jdbcClient = jdbcClient;
    }

    void seed(UUID workspaceId) {
        if (hasExistingPlanningSetup(workspaceId)) {
            throw new WorkspaceConflictException(
                "Sample data cannot be added after planning setup has started"
            );
        }

        insertCategory(workspaceId, SLEEP, "Uyku", "#6366F1", "moon");
        insertCategory(workspaceId, SELF_CARE, "Kişisel Bakım", "#14B8A6", "sparkles");
        insertCategory(workspaceId, WORK, "İş", "#F59E0B", "briefcase-business");
        insertCategory(workspaceId, REST, "Dinlenme", "#8B5CF6", "armchair");
        insertCategory(workspaceId, SPORT, "Spor", "#EF4444", "dumbbell");
        insertCategory(workspaceId, STUDY, "Ders", "#3B82F6", "graduation-cap");

        insertDayType(workspaceId, WORK_DAY, "İş Günü", "#F59E0B");
        insertBlock(WORK_DAY, uuid("03000000-0000-0000-0000-000000000001"), "Uyku", 0, 420, 0, List.of(SLEEP));
        insertBlock(WORK_DAY, uuid("03000000-0000-0000-0000-000000000002"), "Hazırlık", 420, 480, 1, List.of(SELF_CARE));
        insertBlock(WORK_DAY, uuid("03000000-0000-0000-0000-000000000003"), "İş", 480, 1020, 2, List.of(WORK));
        insertBlock(WORK_DAY, uuid("03000000-0000-0000-0000-000000000004"), "Dinlenme", 1020, 1440, 3, List.of(REST));

        insertDayType(workspaceId, REST_DAY, "Dinlenme Günü", "#8B5CF6");
        insertBlock(REST_DAY, uuid("03000000-0000-0000-0000-000000000005"), "Uyku", 0, 480, 0, List.of(SLEEP));
        insertBlock(REST_DAY, uuid("03000000-0000-0000-0000-000000000006"), "Sabah", 480, 600, 1, List.of(SELF_CARE));
        insertBlock(REST_DAY, uuid("03000000-0000-0000-0000-000000000007"), "Serbest Zaman", 600, 1080, 2, List.of(REST, SPORT, STUDY));
        insertBlock(REST_DAY, uuid("03000000-0000-0000-0000-000000000008"), "Akşam", 1080, 1440, 3, List.of(REST));

        for (short day = 1; day <= 7; day++) {
            UUID dayTypeId = day <= 5 ? WORK_DAY : REST_DAY;
            jdbcClient.sql("""
                INSERT INTO shiftarc.weekly_day_assignment (
                    workspace_id, day_of_week, day_type_id
                ) VALUES (:workspaceId, :day, :dayTypeId)
                """)
                .param("workspaceId", workspaceId)
                .param("day", day)
                .param("dayTypeId", dayTypeId)
                .update();
        }
    }

    private boolean hasExistingPlanningSetup(UUID workspaceId) {
        Integer count = jdbcClient.sql("""
            SELECT
                (SELECT count(*) FROM shiftarc.category WHERE workspace_id = :workspaceId)
                + (SELECT count(*) FROM shiftarc.day_type WHERE workspace_id = :workspaceId)
                + (SELECT count(*) FROM shiftarc.weekly_day_assignment WHERE workspace_id = :workspaceId)
            """)
            .param("workspaceId", workspaceId)
            .query(Integer.class)
            .single();
        return count > 0;
    }

    private void insertCategory(
        UUID workspaceId,
        UUID id,
        String name,
        String color,
        String icon
    ) {
        jdbcClient.sql("""
            INSERT INTO shiftarc.category (id, workspace_id, name, color, icon)
            VALUES (:id, :workspaceId, :name, :color, :icon)
            """)
            .param("id", id)
            .param("workspaceId", workspaceId)
            .param("name", name)
            .param("color", color)
            .param("icon", icon)
            .update();
    }

    private void insertDayType(UUID workspaceId, UUID id, String name, String color) {
        jdbcClient.sql("""
            INSERT INTO shiftarc.day_type (id, workspace_id, name, color)
            VALUES (:id, :workspaceId, :name, :color)
            """)
            .param("id", id)
            .param("workspaceId", workspaceId)
            .param("name", name)
            .param("color", color)
            .update();
    }

    private void insertBlock(
        UUID dayTypeId,
        UUID id,
        String name,
        int startMinute,
        int endMinute,
        int position,
        List<UUID> categoryIds
    ) {
        jdbcClient.sql("""
            INSERT INTO shiftarc.day_type_block (
                id, day_type_id, name, start_minute, end_minute, position
            ) VALUES (:id, :dayTypeId, :name, :startMinute, :endMinute, :position)
            """)
            .param("id", id)
            .param("dayTypeId", dayTypeId)
            .param("name", name)
            .param("startMinute", startMinute)
            .param("endMinute", endMinute)
            .param("position", position)
            .update();

        for (UUID categoryId : categoryIds) {
            jdbcClient.sql("""
                INSERT INTO shiftarc.day_type_block_category (
                    day_type_block_id, category_id
                ) VALUES (:blockId, :categoryId)
                """)
                .param("blockId", id)
                .param("categoryId", categoryId)
                .update();
        }
    }

    private static UUID uuid(String value) {
        return UUID.fromString(value);
    }
}
