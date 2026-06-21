CREATE TABLE shiftarc.calendar_day_override (
    workspace_id uuid NOT NULL REFERENCES shiftarc.workspace (id) ON DELETE CASCADE,
    override_date date NOT NULL,
    day_type_id uuid NOT NULL REFERENCES shiftarc.day_type (id) ON DELETE RESTRICT,
    version bigint NOT NULL DEFAULT 0,
    created_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    updated_at timestamp with time zone NOT NULL DEFAULT current_timestamp,
    PRIMARY KEY (workspace_id, override_date)
);

CREATE INDEX calendar_day_override_day_type_lookup
    ON shiftarc.calendar_day_override (day_type_id, override_date);

COMMENT ON TABLE shiftarc.calendar_day_override IS 'Date-specific day type selection applied before daily snapshot generation';
