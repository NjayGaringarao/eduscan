-- Function to mark attendance state for users based on their session activity

drop function if exists public.mark_attendance_state();

CREATE OR REPLACE FUNCTION mark_attendance_state()
RETURNS void AS $$
DECLARE
  current_manila_time timestamptz;
  slot_record RECORD;
  user_record RECORD;
  has_any_attendance boolean;
  slot_start_time timestamptz;
  slot_end_time timestamptz;
  grace_period_minutes integer := 15;
BEGIN
  -- Get current time in Manila (UTC+8)
  current_manila_time := now() AT TIME ZONE 'Asia/Manila';
  
  -- Find slots that just ended (within last minute)
  FOR slot_record IN
    SELECT s.slot_id, s.schedule_id, s.start_time, s.end_time, s.day_of_week
    FROM slot s
    WHERE s.day_of_week = EXTRACT(DOW FROM current_manila_time)
      AND s.end_time <= (current_manila_time::time + interval '1 minute')
      AND s.end_time > (current_manila_time::time - interval '1 minute')
  LOOP
    -- Create slot timestamps for today in Manila timezone
    slot_start_time := (current_manila_time::date + slot_record.start_time) AT TIME ZONE 'Asia/Manila';
    slot_end_time := (current_manila_time::date + slot_record.end_time) AT TIME ZONE 'Asia/Manila';
    
    -- Check if any user attended this slot (with 15-minute grace period)
    SELECT EXISTS(
      SELECT 1 
      FROM attendance_log al
      JOIN "user" u ON al.user_id = u.user_id
      WHERE u.schedule_id = slot_record.schedule_id
        AND al.action = 'TIME_IN'
        AND al.timestamp >= (slot_start_time - interval '15 minutes')
        AND al.timestamp <= (slot_end_time + interval '15 minutes')
    ) INTO has_any_attendance;
    
    -- Skip if attendance_state already exists for this slot and date
    IF EXISTS(
      SELECT 1 FROM attendance_state 
      WHERE slot_id = slot_record.slot_id 
        AND marked_at::date = current_manila_time::date
    ) THEN
      CONTINUE;
    END IF;
    
    IF has_any_attendance THEN
      -- Mark individual users as PRESENT or ABSENT
      FOR user_record IN
        SELECT u.user_id
        FROM "user" u
        WHERE u.schedule_id = slot_record.schedule_id
      LOOP
        -- Check if this specific user attended
        IF EXISTS(
          SELECT 1 
          FROM attendance_log al
          WHERE al.user_id = user_record.user_id
            AND al.action = 'TIME_IN'
            AND al.timestamp >= (slot_start_time - interval '15 minutes')
            AND al.timestamp <= (slot_end_time + interval '15 minutes')
        ) THEN
          -- User attended - mark as PRESENT
          INSERT INTO attendance_state (slot_id, user_id, mark, marked_at)
          VALUES (slot_record.slot_id, user_record.user_id, 'PRESENT', slot_end_time)
          ON CONFLICT (slot_id, user_id, marked_at) DO NOTHING;
        ELSE
          -- User did not attend - mark as ABSENT
          INSERT INTO attendance_state (slot_id, user_id, mark, marked_at)
          VALUES (slot_record.slot_id, user_record.user_id, 'ABSENT', slot_end_time)
          ON CONFLICT (slot_id, user_id, marked_at) DO NOTHING;
        END IF;
      END LOOP;
    ELSE
      -- No users attended - mark all users as CANCELLED
      FOR user_record IN
        SELECT u.user_id
        FROM "user" u
        WHERE u.schedule_id = slot_record.schedule_id
      LOOP
        INSERT INTO attendance_state (slot_id, user_id, mark, marked_at)
        VALUES (slot_record.slot_id, user_record.user_id, 'CANCELLED', slot_end_time)
        ON CONFLICT (slot_id, user_id, marked_at) DO NOTHING;
      END LOOP;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION mark_attendance_state() IS 'Marks attendance state for all users based on their session activity when slots end';
