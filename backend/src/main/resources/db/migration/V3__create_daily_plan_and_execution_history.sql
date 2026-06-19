CREATE TABLE shiftarc.daily_plan (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    plan_date date NOT NULL,
    source_day_type_id uuid REFERENCES shiftarc.day_type (id) ON DELETE SET NULL,
    source_day_type_name varchar(80) NOT NULL,
    timezone varchar(64) NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    generated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    completed_at timestamp with time zone,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT daily_plan_source_name_not_blank CHECK (
        char_length(btrim(source_day_type_name)) BETWEEN 1 AND 80
    ),
    CONSTRAINT daily_plan_timezone_not_blank CHECK (char_length(btrim(timezone)) BETWEEN 1 AND 64),
    CONSTRAINT daily_plan_status_valid CHECK (status IN ('ACTIVE', 'COMPLETED')),
    CONSTRAINT daily_plan_completion_consistent CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL)
        OR (status = 'ACTIVE' AND completed_at IS NULL)
    ),
    CONSTRAINT daily_plan_date_unique UNIQUE (workspace_id, plan_date)
);

CREATE INDEX daily_plan_workspace_date_lookup
    ON shiftarc.daily_plan (workspace_id, plan_date DESC);

CREATE TABLE shiftarc.daily_plan_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_plan_id uuid NOT NULL REFERENCES shiftarc.daily_plan (id) ON DELETE CASCADE,
    source_day_type_block_id uuid REFERENCES shiftarc.day_type_block (id) ON DELETE SET NULL,
    name varchar(80) NOT NULL,
    start_minute smallint NOT NULL,
    end_minute smallint NOT NULL,
    position smallint NOT NULL,
    CONSTRAINT daily_plan_block_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT daily_plan_block_range_valid CHECK (
        start_minute >= 0 AND end_minute <= 1440 AND start_minute < end_minute
    ),
    CONSTRAINT daily_plan_block_five_minute_grid CHECK (
        mod(start_minute, 5) = 0 AND mod(end_minute, 5) = 0
    ),
    CONSTRAINT daily_plan_block_position_valid CHECK (position >= 0),
    CONSTRAINT daily_plan_block_position_unique UNIQUE (daily_plan_id, position),
    CONSTRAINT daily_plan_block_start_unique UNIQUE (daily_plan_id, start_minute)
);

CREATE INDEX daily_plan_block_order
    ON shiftarc.daily_plan_block (daily_plan_id, start_minute);

CREATE TABLE shiftarc.daily_plan_item (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_plan_block_id uuid NOT NULL REFERENCES shiftarc.daily_plan_block (id) ON DELETE CASCADE,
    task_id uuid REFERENCES shiftarc.task (id) ON DELETE SET NULL,
    task_title varchar(160) NOT NULL,
    planned_start_minute smallint NOT NULL,
    planned_end_minute smallint NOT NULL,
    position smallint NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'PLANNED',
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT daily_plan_item_title_not_blank CHECK (char_length(btrim(task_title)) BETWEEN 1 AND 160),
    CONSTRAINT daily_plan_item_range_valid CHECK (
        planned_start_minute >= 0
        AND planned_end_minute <= 1440
        AND planned_start_minute < planned_end_minute
    ),
    CONSTRAINT daily_plan_item_five_minute_grid CHECK (
        mod(planned_start_minute, 5) = 0 AND mod(planned_end_minute, 5) = 0
    ),
    CONSTRAINT daily_plan_item_position_valid CHECK (position >= 0),
    CONSTRAINT daily_plan_item_status_valid CHECK (
        status IN ('PLANNED', 'ACTIVE', 'COMPLETED', 'SKIPPED')
    ),
    CONSTRAINT daily_plan_item_position_unique UNIQUE (daily_plan_block_id, position)
);

CREATE INDEX daily_plan_item_block_order
    ON shiftarc.daily_plan_item (daily_plan_block_id, planned_start_minute);
CREATE INDEX daily_plan_item_task_lookup
    ON shiftarc.daily_plan_item (task_id, created_at DESC)
    WHERE task_id IS NOT NULL;

CREATE TABLE shiftarc.daily_plan_warning (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    daily_plan_id uuid NOT NULL REFERENCES shiftarc.daily_plan (id) ON DELETE CASCADE,
    task_id uuid REFERENCES shiftarc.task (id) ON DELETE SET NULL,
    reason_code varchar(48) NOT NULL,
    unallocated_minutes integer NOT NULL,
    detail varchar(500) NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT daily_plan_warning_reason_not_blank CHECK (
        char_length(btrim(reason_code)) BETWEEN 1 AND 48
    ),
    CONSTRAINT daily_plan_warning_minutes_valid CHECK (
        unallocated_minutes > 0 AND mod(unallocated_minutes, 5) = 0
    ),
    CONSTRAINT daily_plan_warning_detail_not_blank CHECK (
        char_length(btrim(detail)) BETWEEN 1 AND 500
    )
);

CREATE INDEX daily_plan_warning_plan_lookup
    ON shiftarc.daily_plan_warning (daily_plan_id, created_at);

CREATE TABLE shiftarc.task_execution_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    task_id uuid NOT NULL REFERENCES shiftarc.task (id) ON DELETE RESTRICT,
    daily_plan_item_id uuid REFERENCES shiftarc.daily_plan_item (id) ON DELETE SET NULL,
    started_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT task_execution_session_range_valid CHECK (
        ended_at IS NULL OR ended_at > started_at
    )
);

CREATE UNIQUE INDEX task_execution_single_active_session
    ON shiftarc.task_execution_session (workspace_id)
    WHERE ended_at IS NULL;
CREATE INDEX task_execution_task_history
    ON shiftarc.task_execution_session (task_id, started_at DESC);
CREATE INDEX task_execution_workspace_history
    ON shiftarc.task_execution_session (workspace_id, started_at DESC);

CREATE TABLE shiftarc.task_execution_event (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    session_id uuid NOT NULL REFERENCES shiftarc.task_execution_session (id) ON DELETE RESTRICT,
    event_type varchar(32) NOT NULL,
    occurred_at timestamp with time zone NOT NULL,
    payload jsonb NOT NULL DEFAULT '{}'::jsonb,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT task_execution_event_type_valid CHECK (
        event_type IN ('STARTED', 'FINISHED', 'TRANSITIONED', 'TIMES_CORRECTED')
    ),
    CONSTRAINT task_execution_event_payload_object CHECK (jsonb_typeof(payload) = 'object')
);

CREATE INDEX task_execution_event_session_history
    ON shiftarc.task_execution_event (session_id, occurred_at, created_at);
CREATE INDEX task_execution_event_workspace_history
    ON shiftarc.task_execution_event (workspace_id, occurred_at DESC);

CREATE FUNCTION shiftarc.reject_execution_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'task_execution_event is append-only';
END;
$$;

CREATE TRIGGER task_execution_event_append_only
BEFORE UPDATE OR DELETE ON shiftarc.task_execution_event
FOR EACH ROW
EXECUTE FUNCTION shiftarc.reject_execution_event_mutation();

COMMENT ON TABLE shiftarc.daily_plan IS 'Immutable daily structure with explicitly re-plannable future items';
COMMENT ON TABLE shiftarc.task_execution_event IS 'Append-only audit trail for task execution changes';
