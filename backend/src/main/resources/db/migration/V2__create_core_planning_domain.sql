CREATE TABLE shiftarc.workspace (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    slug varchar(64) NOT NULL,
    name varchar(120) NOT NULL,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT workspace_slug_format CHECK (slug ~ '^[a-z][a-z0-9-]{1,62}[a-z0-9]$'),
    CONSTRAINT workspace_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 120),
    CONSTRAINT workspace_slug_unique UNIQUE (slug)
);

CREATE TABLE shiftarc.workspace_settings (
    workspace_id uuid PRIMARY KEY REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    timezone varchar(64) NOT NULL DEFAULT 'Europe/Istanbul',
    week_starts_on smallint NOT NULL DEFAULT 1,
    theme_id varchar(64) NOT NULL DEFAULT 'arc-midnight',
    background_mode varchar(24) NOT NULL DEFAULT 'TIME_AWARE',
    onboarding_completed boolean NOT NULL DEFAULT false,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT workspace_settings_week_start_valid CHECK (week_starts_on BETWEEN 1 AND 7),
    CONSTRAINT workspace_settings_theme_not_blank CHECK (char_length(btrim(theme_id)) BETWEEN 1 AND 64),
    CONSTRAINT workspace_settings_background_mode_valid CHECK (
        background_mode IN ('TIME_AWARE', 'STATIC')
    )
);

CREATE TABLE shiftarc.category (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    name varchar(80) NOT NULL,
    color varchar(7) NOT NULL,
    icon varchar(64),
    archived boolean NOT NULL DEFAULT false,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT category_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT category_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$'),
    CONSTRAINT category_icon_not_blank CHECK (icon IS NULL OR char_length(btrim(icon)) BETWEEN 1 AND 64)
);

CREATE UNIQUE INDEX category_active_name_unique
    ON shiftarc.category (workspace_id, lower(btrim(name)))
    WHERE archived = false;
CREATE INDEX category_workspace_lookup
    ON shiftarc.category (workspace_id, archived, name);

CREATE TABLE shiftarc.day_type (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    name varchar(80) NOT NULL,
    color varchar(7) NOT NULL,
    archived boolean NOT NULL DEFAULT false,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT day_type_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT day_type_color_hex CHECK (color ~ '^#[0-9A-Fa-f]{6}$')
);

CREATE UNIQUE INDEX day_type_active_name_unique
    ON shiftarc.day_type (workspace_id, lower(btrim(name)))
    WHERE archived = false;
CREATE INDEX day_type_workspace_lookup
    ON shiftarc.day_type (workspace_id, archived, name);

CREATE TABLE shiftarc.day_type_block (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    day_type_id uuid NOT NULL REFERENCES shiftarc.day_type (id) ON DELETE CASCADE,
    name varchar(80) NOT NULL,
    start_minute smallint NOT NULL,
    end_minute smallint NOT NULL,
    position smallint NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT day_type_block_name_not_blank CHECK (char_length(btrim(name)) BETWEEN 1 AND 80),
    CONSTRAINT day_type_block_range_valid CHECK (
        start_minute >= 0 AND end_minute <= 1440 AND start_minute < end_minute
    ),
    CONSTRAINT day_type_block_five_minute_grid CHECK (
        mod(start_minute, 5) = 0 AND mod(end_minute, 5) = 0
    ),
    CONSTRAINT day_type_block_position_valid CHECK (position >= 0),
    CONSTRAINT day_type_block_position_unique UNIQUE (day_type_id, position),
    CONSTRAINT day_type_block_start_unique UNIQUE (day_type_id, start_minute)
);

CREATE INDEX day_type_block_order
    ON shiftarc.day_type_block (day_type_id, start_minute);

CREATE TABLE shiftarc.day_type_block_category (
    day_type_block_id uuid NOT NULL REFERENCES shiftarc.day_type_block (id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES shiftarc.category (id) ON DELETE RESTRICT,
    PRIMARY KEY (day_type_block_id, category_id)
);

CREATE INDEX day_type_block_category_category_lookup
    ON shiftarc.day_type_block_category (category_id, day_type_block_id);

CREATE TABLE shiftarc.weekly_day_assignment (
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    day_of_week smallint NOT NULL,
    day_type_id uuid NOT NULL REFERENCES shiftarc.day_type (id) ON DELETE RESTRICT,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT weekly_day_assignment_day_valid CHECK (day_of_week BETWEEN 1 AND 7),
    PRIMARY KEY (workspace_id, day_of_week)
);

CREATE INDEX weekly_day_assignment_day_type_lookup
    ON shiftarc.weekly_day_assignment (day_type_id);

CREATE TABLE shiftarc.task (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    task_type varchar(24) NOT NULL,
    title varchar(160) NOT NULL,
    description varchar(2000),
    importance smallint NOT NULL,
    status varchar(24) NOT NULL DEFAULT 'ACTIVE',
    total_required_minutes integer,
    deadline date,
    weekly_target_minutes integer,
    completed_at timestamp with time zone,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    CONSTRAINT task_type_valid CHECK (task_type IN ('WORK_ITEM', 'HABIT')),
    CONSTRAINT task_title_not_blank CHECK (char_length(btrim(title)) BETWEEN 1 AND 160),
    CONSTRAINT task_description_length CHECK (description IS NULL OR char_length(description) <= 2000),
    CONSTRAINT task_importance_valid CHECK (importance BETWEEN 1 AND 5),
    CONSTRAINT task_status_valid CHECK (status IN ('ACTIVE', 'COMPLETED', 'ARCHIVED')),
    CONSTRAINT task_status_completion_consistent CHECK (
        (status = 'COMPLETED' AND completed_at IS NOT NULL)
        OR (status <> 'COMPLETED' AND completed_at IS NULL)
    ),
    CONSTRAINT task_type_fields_valid CHECK (
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
    )
);

CREATE INDEX task_workspace_status_lookup
    ON shiftarc.task (workspace_id, status, task_type);
CREATE INDEX task_work_item_deadline_lookup
    ON shiftarc.task (workspace_id, deadline, importance DESC)
    WHERE task_type = 'WORK_ITEM' AND status = 'ACTIVE';
CREATE INDEX task_habit_priority_lookup
    ON shiftarc.task (workspace_id, importance DESC, created_at)
    WHERE task_type = 'HABIT' AND status = 'ACTIVE';

CREATE TABLE shiftarc.task_category (
    task_id uuid NOT NULL REFERENCES shiftarc.task (id) ON DELETE CASCADE,
    category_id uuid NOT NULL REFERENCES shiftarc.category (id) ON DELETE RESTRICT,
    PRIMARY KEY (task_id, category_id)
);

CREATE INDEX task_category_category_lookup
    ON shiftarc.task_category (category_id, task_id);

INSERT INTO shiftarc.workspace (id, slug, name)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    'local-workspace',
    'Lokal Çalışma Alanı'
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO shiftarc.workspace_settings (workspace_id)
VALUES ('00000000-0000-0000-0000-000000000001')
ON CONFLICT (workspace_id) DO NOTHING;

COMMENT ON TABLE shiftarc.workspace IS 'Workspace ownership boundary for future multi-user isolation';
COMMENT ON TABLE shiftarc.day_type_block IS 'Five-minute time segments that must form a complete day per day type';
COMMENT ON TABLE shiftarc.task IS 'Work items and recurring weekly habits';
