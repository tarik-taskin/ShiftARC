ALTER TABLE shiftarc.workspace_settings
  ADD COLUMN color_mode varchar(16) NOT NULL DEFAULT 'LIGHT',
  ADD COLUMN clock_style varchar(16) NOT NULL DEFAULT 'DIGITAL',
  ADD CONSTRAINT workspace_color_mode_valid CHECK (color_mode IN ('LIGHT', 'DARK')),
  ADD CONSTRAINT workspace_clock_style_valid CHECK (clock_style IN ('DIGITAL', 'DIAL', 'SEGMENT'));

UPDATE shiftarc.workspace_settings
SET color_mode = CASE WHEN onboarding_completed AND theme_id IN ('arc-midnight', 'aurora') THEN 'DARK' ELSE 'LIGHT' END,
    background_mode = CASE WHEN onboarding_completed THEN background_mode ELSE 'STATIC' END,
    theme_id = CASE WHEN theme_id = 'aurora' THEN 'ion' ELSE 'amber' END,
    version = version + 1,
    updated_at = current_timestamp;

ALTER TABLE shiftarc.workspace_settings
  ALTER COLUMN theme_id SET DEFAULT 'amber',
  ALTER COLUMN background_mode SET DEFAULT 'STATIC',
  ADD CONSTRAINT workspace_theme_valid CHECK (theme_id IN ('amber', 'ion', 'grove'));
