CREATE TABLE shiftarc.pomodoro_settings (
    workspace_id uuid PRIMARY KEY REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    focus_minutes smallint NOT NULL DEFAULT 25,
    short_break_minutes smallint NOT NULL DEFAULT 5,
    long_break_minutes smallint NOT NULL DEFAULT 15,
    cycles_before_long_break smallint NOT NULL DEFAULT 4,
    version bigint NOT NULL DEFAULT 0,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT pomodoro_settings_focus_valid CHECK (focus_minutes BETWEEN 5 AND 120),
    CONSTRAINT pomodoro_settings_break_valid CHECK (
        short_break_minutes BETWEEN 1 AND 30 AND long_break_minutes BETWEEN 5 AND 60
    ),
    CONSTRAINT pomodoro_settings_cycles_valid CHECK (cycles_before_long_break BETWEEN 2 AND 8)
);

CREATE TABLE shiftarc.pomodoro_session (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    task_id uuid REFERENCES shiftarc.task (id) ON DELETE SET NULL,
    phase varchar(24) NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    duration_minutes smallint NOT NULL,
    started_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    planned_end_at timestamp with time zone NOT NULL,
    ended_at timestamp with time zone,
    version bigint NOT NULL DEFAULT 0,
    CONSTRAINT pomodoro_session_phase_valid CHECK (phase IN ('FOCUS', 'SHORT_BREAK', 'LONG_BREAK')),
    CONSTRAINT pomodoro_session_status_valid CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT pomodoro_session_end_valid CHECK (
        (status = 'ACTIVE' AND ended_at IS NULL) OR (status <> 'ACTIVE' AND ended_at IS NOT NULL)
    )
);

CREATE UNIQUE INDEX pomodoro_single_active_session
    ON shiftarc.pomodoro_session (workspace_id) WHERE status = 'ACTIVE';
CREATE INDEX pomodoro_workspace_history
    ON shiftarc.pomodoro_session (workspace_id, started_at DESC);

INSERT INTO shiftarc.pomodoro_settings (workspace_id)
SELECT id FROM shiftarc.workspace ON CONFLICT (workspace_id) DO NOTHING;

COMMENT ON TABLE shiftarc.pomodoro_session IS 'Persisted focus and break timer lifecycle';
