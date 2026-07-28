-- Lets a system_log row carry the reference number of the attendance_log
-- entry it corresponds to (the same number printed on the kiosk receipt),
-- so admins can cross-reference a physical receipt back to its log entry.
-- Nullable and unconstrained: most log types (admin actions, auth events,
-- etc.) have no associated attendance record.

ALTER TABLE public.system_log ADD COLUMN reference_id bigint;
