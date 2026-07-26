ALTER TABLE shiftarc.task
    ADD COLUMN daily_limit_minutes integer;

ALTER TABLE shiftarc.task
    DROP CONSTRAINT task_type_valid,
    DROP CONSTRAINT task_type_fields_valid;

ALTER TABLE shiftarc.task
    ADD CONSTRAINT task_type_valid CHECK (task_type IN ('WORK_ITEM', 'HABIT', 'OPPORTUNITY')),
    ADD CONSTRAINT task_daily_limit_valid CHECK (
        daily_limit_minutes IS NULL OR (daily_limit_minutes > 0 AND mod(daily_limit_minutes, 5) = 0)
    ),
    ADD CONSTRAINT task_type_fields_valid CHECK (
        (
            task_type = 'WORK_ITEM'
            AND total_required_minutes IS NOT NULL
            AND total_required_minutes > 0
            AND mod(total_required_minutes, 5) = 0
            AND deadline IS NOT NULL
            AND weekly_target_minutes IS NULL
        )
        OR
        (
            task_type = 'HABIT'
            AND weekly_target_minutes IS NOT NULL
            AND weekly_target_minutes > 0
            AND mod(weekly_target_minutes, 5) = 0
            AND total_required_minutes IS NULL
            AND deadline IS NULL
        )
        OR
        (
            task_type = 'OPPORTUNITY'
            AND total_required_minutes IS NULL
            AND weekly_target_minutes IS NULL
            AND deadline IS NULL
        )
    );

CREATE TABLE shiftarc.task_stage (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id uuid NOT NULL REFERENCES shiftarc.task (id) ON DELETE CASCADE,
    title varchar(160) NOT NULL,
    position smallint NOT NULL,
    completed boolean NOT NULL DEFAULT false,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT task_stage_title_not_blank CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
    CONSTRAINT task_stage_position_valid CHECK (position >= 0),
    CONSTRAINT task_stage_completion_consistent CHECK (
        (completed = true AND completed_at IS NOT NULL)
        OR (completed = false AND completed_at IS NULL)
    ),
    CONSTRAINT task_stage_position_unique UNIQUE (task_id, position)
);

CREATE INDEX task_stage_task_order
    ON shiftarc.task_stage (task_id, position);

ALTER TABLE shiftarc.daily_plan_item
    ADD COLUMN task_stage_title varchar(160);

CREATE TABLE shiftarc.trigger_rule_day_type (
    trigger_rule_id uuid NOT NULL REFERENCES shiftarc.trigger_rule (id) ON DELETE CASCADE,
    day_type_id uuid NOT NULL REFERENCES shiftarc.day_type (id) ON DELETE RESTRICT,
    PRIMARY KEY (trigger_rule_id, day_type_id)
);

CREATE INDEX trigger_rule_day_type_day_type_lookup
    ON shiftarc.trigger_rule_day_type (day_type_id, trigger_rule_id);

COMMENT ON COLUMN shiftarc.task.daily_limit_minutes IS 'Optional per-day planning cap for any task type';
COMMENT ON TABLE shiftarc.task_stage IS 'Ordered non-task stages that describe the current focus inside a task';
COMMENT ON TABLE shiftarc.trigger_rule_day_type IS 'Optional day type scope for trigger rules; no rows means all day types';
