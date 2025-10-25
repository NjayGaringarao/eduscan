-- Create attendance_state table for tracking user attendance patterns
CREATE TABLE public.attendance_state (
  state_id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slot_id bigint NOT NULL REFERENCES public.slot(slot_id),
  user_id text NOT NULL REFERENCES public.user(user_id),
  mark text NOT NULL CHECK (mark IN ('PRESENT', 'ABSENT', 'CANCELLED')),
  marked_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT attendance_state_unique_slot_user_date UNIQUE (slot_id, user_id, marked_at)
);

-- Create indexes for performance
CREATE INDEX idx_attendance_state_user_id ON public.attendance_state(user_id);
CREATE INDEX idx_attendance_state_marked_at ON public.attendance_state(marked_at);
CREATE INDEX idx_attendance_state_slot_id ON public.attendance_state(slot_id);
CREATE INDEX idx_attendance_state_mark ON public.attendance_state(mark);

-- Add comments for documentation
COMMENT ON TABLE public.attendance_state IS 'Tracks attendance state for each user per scheduled slot';
COMMENT ON COLUMN public.attendance_state.mark IS 'PRESENT: user attended, ABSENT: user did not attend, CANCELLED: no users attended (schedule cancelled)';
COMMENT ON COLUMN public.attendance_state.marked_at IS 'Timestamp when attendance was marked (date + slot start_time in UTC+8)';
