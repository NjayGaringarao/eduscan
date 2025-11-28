DROP FUNCTION IF EXISTS public.mark_attendance_state();

-- Helper function to check if attendance state already exists for a user/slot combination
CREATE OR REPLACE FUNCTION public._check_attendance_state_exists(
  p_user_id uuid,
  p_marked_at_date date,
  p_end_time time
)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM attendance_state
    WHERE user_id = p_user_id
      AND marked_at::date = p_marked_at_date
      AND DATE_TRUNC('minute', marked_at::time) = DATE_TRUNC('minute', p_end_time)
  );
END;
$$;

-- Helper function to check if a user has TIME_IN attendance within slot time window
CREATE OR REPLACE FUNCTION public._user_has_attendance(
  p_user_id uuid,
  p_slot_start_time timestamptz,
  p_slot_end_time timestamptz,
  p_grace_period_minutes integer
)
RETURNS boolean
LANGUAGE plpgsql
STABLE
AS $$
BEGIN
  RETURN EXISTS(
    SELECT 1
    FROM attendance_log al
    WHERE al.user_id = p_user_id
      AND al.action = 'TIME_IN'
      AND al.timestamp >= (p_slot_start_time - (p_grace_period_minutes || ' minutes')::interval)
      AND al.timestamp <= (p_slot_end_time + (p_grace_period_minutes || ' minutes')::interval)
  );
END;
$$;

-- Helper function to insert or update attendance state for a user
CREATE OR REPLACE FUNCTION public._insert_attendance_state(
  p_user_id uuid,
  p_mark text,
  p_marked_at timestamptz,
  p_marked_at_date date,
  p_end_time time
)
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO attendance_state (user_id, mark, marked_at)
  SELECT p_user_id, p_mark, p_marked_at
  WHERE NOT public._check_attendance_state_exists(p_user_id, p_marked_at_date, p_end_time);
END;
$$;

-- Main function to mark attendance state
CREATE OR REPLACE FUNCTION public.mark_attendance_state()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_utc_time timestamptz;
  current_manila_date date;
  current_manila_time time;
  slot_record RECORD;
  user_record RECORD;
  has_any_attendance boolean;
  slot_start_time timestamptz;
  slot_end_time timestamptz;
  grace_period_minutes integer := 15;
  processing_window_minutes integer := 15;  -- Process slots that ended in last 15 minutes
  user_has_time_in boolean;
BEGIN
  -- Compute timezone conversions once at the start
  current_utc_time := now();
  current_manila_date := (current_utc_time AT TIME ZONE 'Asia/Manila')::date;
  current_manila_time := (current_utc_time AT TIME ZONE 'Asia/Manila')::time;

  FOR slot_record IN
    SELECT s.id, s.schedule_id, s.start_time, s.end_time, s.day_of_week, s.marked_at
    FROM slot s
    WHERE s.day_of_week = EXTRACT(DOW FROM (current_utc_time AT TIME ZONE 'Asia/Manila'))
      AND s.end_time <= current_manila_time
      AND s.end_time > (current_manila_time - (processing_window_minutes || ' minutes')::interval)
      AND (
        s.marked_at IS NULL 
        OR (s.marked_at AT TIME ZONE 'Asia/Manila')::date < current_manila_date
        OR (
          (s.marked_at AT TIME ZONE 'Asia/Manila')::date = current_manila_date 
          AND DATE_TRUNC('minute', (s.marked_at AT TIME ZONE 'Asia/Manila')::time) != DATE_TRUNC('minute', s.end_time)
        )
      )
  LOOP
    -- Use advisory lock to prevent concurrent processing of the same slot
    PERFORM pg_advisory_lock(slot_record.id::bigint);

    -- Double-check that slot hasn't been marked by another process
    IF EXISTS(
      SELECT 1 FROM slot 
      WHERE id = slot_record.id 
        AND marked_at IS NOT NULL
        AND (marked_at AT TIME ZONE 'Asia/Manila')::date = current_manila_date
        AND DATE_TRUNC('minute', (marked_at AT TIME ZONE 'Asia/Manila')::time) = DATE_TRUNC('minute', slot_record.end_time)
    ) THEN
      PERFORM pg_advisory_unlock(slot_record.id::bigint);
      CONTINUE;
    END IF;

    -- Compute slot time boundaries once per slot
    slot_start_time := ((current_manila_date + slot_record.start_time)::timestamp) AT TIME ZONE 'Asia/Manila';
    slot_end_time   := ((current_manila_date + slot_record.end_time)::timestamp) AT TIME ZONE 'Asia/Manila';

    -- Check if ANY user in this schedule has attendance (determines if slot is active)
    SELECT EXISTS(
      SELECT 1
      FROM attendance_log al
      JOIN "user" u ON al.user_id = u.id
      WHERE u.schedule_id = slot_record.schedule_id
        AND al.action = 'TIME_IN'
        AND al.timestamp >= (slot_start_time - (grace_period_minutes || ' minutes')::interval)
        AND al.timestamp <= (slot_end_time + (grace_period_minutes || ' minutes')::interval)
    ) INTO has_any_attendance;

    BEGIN
      -- Process all users for this slot
      FOR user_record IN
        SELECT u.id
        FROM "user" u
        WHERE u.schedule_id = slot_record.schedule_id
      LOOP
        BEGIN
          IF has_any_attendance THEN
            -- Slot has attendance - mark users as PRESENT or ABSENT
            user_has_time_in := public._user_has_attendance(
              user_record.id,
              slot_start_time,
              slot_end_time,
              grace_period_minutes
            );
            
            IF user_has_time_in THEN
              PERFORM public._insert_attendance_state(
                user_record.id,
                'PRESENT',
                slot_end_time,
                current_manila_date,
                slot_record.end_time
              );
            ELSE
              PERFORM public._insert_attendance_state(
                user_record.id,
                'ABSENT',
                slot_end_time,
                current_manila_date,
                slot_record.end_time
              );
            END IF;
          ELSE
            -- No attendance at all - mark all users as CANCELLED
            PERFORM public._insert_attendance_state(
              user_record.id,
              'CANCELLED',
              slot_end_time,
              current_manila_date,
              slot_record.end_time
            );
          END IF;
        EXCEPTION WHEN OTHERS THEN
          -- Log user-specific errors but continue processing other users
          INSERT INTO system_log (type, title, description)
          VALUES (
            'ERROR',
            'User attendance insert failed',
            'Slot ' || slot_record.id || ', User ' || user_record.id || ': ' || SQLERRM
          );
        END;
      END LOOP;

      -- Log the overall slot processing result
      IF has_any_attendance THEN
        INSERT INTO system_log (type, title, description)
        VALUES (
          'SYSTEM.ATTENDANCE',
          'Attendance Marked Successfully',
          'Attendance state for each user that is associated with the schedule with slot_id: ' || slot_record.id || ' has been ABSENT/PRESENT marked.'
        );
      ELSE
        INSERT INTO system_log (type, title, description)
        VALUES (
          'SYSTEM.ATTENDANCE',
          'Attendance Marked Cancelled',
          'Attendance state for each user that is associated with the schedule with slot_id: ' || slot_record.id || ' has been CANCELLED marked due to no attendance.'
        );
      END IF;

    EXCEPTION WHEN OTHERS THEN
      -- Log slot-level errors
      INSERT INTO system_log (type, title, description)
      VALUES (
        'ERROR',
        'Slot processing failed',
        'Slot ' || slot_record.id || ': ' || SQLERRM
      );
    END;

    -- Update slot marked_at timestamp
    UPDATE slot 
    SET marked_at = slot_end_time
    WHERE id = slot_record.id;

    -- Release advisory lock
    PERFORM pg_advisory_unlock(slot_record.id::bigint);
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  -- Log function-level errors
  INSERT INTO system_log (type, title, description)
  VALUES ('ERROR', 'Function failed', SQLERRM);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.mark_attendance_state() TO service_role;
GRANT EXECUTE ON FUNCTION public._check_attendance_state_exists(uuid, date, time) TO service_role;
GRANT EXECUTE ON FUNCTION public._user_has_attendance(uuid, timestamptz, timestamptz, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public._insert_attendance_state(uuid, text, timestamptz, date, time) TO service_role;

-- Schedule the job to run every 15 minutes to process attendance states
-- Note: Cron schedule format: minute hour day month weekday
-- '*/15 * * * *' means run every 15 minutes
SELECT cron.schedule(
  'mark-attendance-state',
  '*/15 * * * *',  -- Run every 15 minutes
  $$
  SELECT public.mark_attendance_state();
  $$
);

COMMENT ON FUNCTION public.mark_attendance_state() IS 
'Marks attendance state (PRESENT/ABSENT/CANCELLED) for users based on their attendance logs for completed time slots';
