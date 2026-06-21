ALTER TABLE shiftarc.daily_plan_item
    ADD COLUMN user_priority smallint;

ALTER TABLE shiftarc.daily_plan_item
    ADD CONSTRAINT daily_plan_item_user_priority_valid
    CHECK (user_priority IS NULL OR user_priority BETWEEN 1 AND 5);

COMMENT ON COLUMN shiftarc.daily_plan_item.user_priority IS
    'Snapshot-specific priority override; null preserves the task priority at generation time';
