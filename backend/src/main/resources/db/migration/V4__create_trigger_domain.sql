CREATE TABLE shiftarc.trigger_rule (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    trigger_type varchar(24) NOT NULL,
    schedule_type varchar(32) NOT NULL,
    title varchar(160) NOT NULL,
    description varchar(1000),
    importance smallint NOT NULL,
    duration_minutes smallint NOT NULL,
    interval_minutes integer,
    occurrence_target integer,
    completed_occurrences integer NOT NULL DEFAULT 0,
    next_due_at timestamp with time zone,
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT trigger_rule_type_valid CHECK (trigger_type IN ('WORK_ITEM', 'HABIT')),
    CONSTRAINT trigger_rule_schedule_valid CHECK (schedule_type IN ('INTERVAL', 'AFTER_CATEGORY')),
    CONSTRAINT trigger_rule_title_not_blank CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
    CONSTRAINT trigger_rule_importance_valid CHECK (importance BETWEEN 1 AND 5),
    CONSTRAINT trigger_rule_duration_valid CHECK (duration_minutes > 0 AND mod(duration_minutes, 5) = 0),
    CONSTRAINT trigger_rule_interval_valid CHECK (
        (schedule_type = 'INTERVAL' AND interval_minutes >= 30)
        OR (schedule_type = 'AFTER_CATEGORY' AND interval_minutes IS NULL)
    ),
    CONSTRAINT trigger_rule_target_valid CHECK (
        (trigger_type = 'WORK_ITEM' AND occurrence_target > 0)
        OR (trigger_type = 'HABIT' AND occurrence_target IS NULL)
    ),
    CONSTRAINT trigger_rule_status_valid CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED'))
);

CREATE TABLE shiftarc.trigger_rule_category (
    trigger_rule_id uuid NOT NULL REFERENCES shiftarc.trigger_rule (id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES shiftarc.category (id) ON DELETE RESTRICT,
    PRIMARY KEY (trigger_rule_id, category_id)
);

CREATE TABLE shiftarc.trigger_occurrence (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    trigger_rule_id uuid NOT NULL REFERENCES shiftarc.trigger_rule (id) ON DELETE RESTRICT,
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    due_at timestamp with time zone,
    completed_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    duration_minutes smallint NOT NULL,
    CONSTRAINT trigger_occurrence_duration_valid CHECK (duration_minutes > 0)
);

CREATE INDEX trigger_rule_due_lookup
    ON shiftarc.trigger_rule (workspace_id, next_due_at)
    WHERE status = 'ACTIVE';
CREATE INDEX trigger_occurrence_history
    ON shiftarc.trigger_occurrence (workspace_id, completed_at DESC);

COMMENT ON TABLE shiftarc.trigger_rule IS 'Small recurring or finite actions surfaced independently from tasks';
