DROP FUNCTION IF EXISTS public.mark_attendance_state();

CREATE OR REPLACE FUNCTION public.mark_attendance_state()
RETURNS void AS $$
DECLARE
  current_manila_timestamp timestamptz;
  v_date date;
  v_time time;
  slot_record RECORD;
  user_record RECORD;
  has_any_attendance boolean;
  slot_start_time timestamptz;
  slot_end_time timestamptz;
  grace_period_minutes integer := 15;
BEGIN
  -- 🕒 Convert current UTC time to Manila local
  current_manila_timestamp := now() AT TIME ZONE 'Asia/Manila';
  v_date := current_manila_timestamp::date;
  v_time := current_manila_timestamp::time;

  -- 🔍 Find slots that just ended (within last 5 minutes window)
  FOR slot_record IN
    SELECT s.id, s.schedule_id, s.start_time, s.end_time, s.day_of_week
    FROM slot s
    WHERE s.day_of_week = EXTRACT(DOW FROM current_manila_timestamp)
      AND s.end_time BETWEEN (v_time - interval '5 minutes') AND v_time
  LOOP
    -- 🧷 Prevent concurrent runs from reprocessing same slot
    PERFORM pg_advisory_lock(slot_record.id::bigint);

    -- Build today's slot start/end timestamps (Manila-local)
    slot_start_time := (v_date + slot_record.start_time) AT TIME ZONE 'Asia/Manila';
    slot_end_time   := (v_date + slot_record.end_time) AT TIME ZONE 'Asia/Manila';

    -- 🧩 Check if anyone timed in for this slot (±15 min grace)
    SELECT EXISTS(
      SELECT 1
      FROM attendance_log al
      JOIN "user" u ON al.user_id = u.id
      WHERE u.schedule_id = slot_record.schedule_id
        AND al.action = 'TIME_IN'
        AND al.timestamp >= (slot_start_time - (grace_period_minutes || ' minutes')::interval)
        AND al.timestamp <= (slot_end_time + (grace_period_minutes || ' minutes')::interval)
    ) INTO has_any_attendance;

    -- 🧱 Skip if attendance_state already exists for this slot & date
    IF EXISTS(
      SELECT 1
      FROM attendance_state ast
      JOIN "user" u ON ast.user_id = u.id
      WHERE u.schedule_id = slot_record.schedule_id
        AND ast.marked_at::date = v_date
        AND abs(EXTRACT(EPOCH FROM (ast.marked_at::time - slot_record.end_time))) < 60
    ) THEN
      PERFORM pg_advisory_unlock(slot_record.id::bigint);
      CONTINUE;
    END IF;

    -- 🧾 CASE 1: Some attendance found → mark individuals PRESENT/ABSENT
    IF has_any_attendance THEN
      FOR user_record IN
        SELECT u.id
        FROM "user" u
        WHERE u.schedule_id = slot_record.schedule_id
      LOOP
        IF EXISTS(
          SELECT 1
          FROM attendance_log al
          WHERE al.user_id = user_record.id
            AND al.action = 'TIME_IN'
            AND al.timestamp >= (slot_start_time - (grace_period_minutes || ' minutes')::interval)
            AND al.timestamp <= (slot_end_time + (grace_period_minutes || ' minutes')::interval)
        ) THEN
          -- ✅ PRESENT
          INSERT INTO attendance_state (user_id, mark, marked_at)
          SELECT user_record.id, 'PRESENT', slot_end_time
          WHERE NOT EXISTS (
            SELECT 1 FROM attendance_state
            WHERE user_id = user_record.id
              AND marked_at::date = v_date
              AND abs(EXTRACT(EPOCH FROM (marked_at::time - slot_record.end_time))) < 60
          );
        ELSE
          -- ❌ ABSENT
          INSERT INTO attendance_state (user_id, mark, marked_at)
          SELECT user_record.id, 'ABSENT', slot_end_time
          WHERE NOT EXISTS (
            SELECT 1 FROM attendance_state
            WHERE user_id = user_record.id
              AND marked_at::date = v_date
              AND abs(EXTRACT(EPOCH FROM (marked_at::time - slot_record.end_time))) < 60
          );
        END IF;
      END LOOP;

    -- 🧾 CASE 2: No one attended → mark all users as CANCELLED
    ELSE
      FOR user_record IN
        SELECT u.id
        FROM "user" u
        WHERE u.schedule_id = slot_record.schedule_id
      LOOP
        INSERT INTO attendance_state (user_id, mark, marked_at)
        SELECT user_record.id, 'CANCELLED', slot_end_time
        WHERE NOT EXISTS (
          SELECT 1 FROM attendance_state
          WHERE user_id = user_record.id
            AND marked_at::date = v_date
            AND abs(EXTRACT(EPOCH FROM (marked_at::time - slot_record.end_time))) < 60
        );
      END LOOP;
    END IF;

    -- 🧾 Log processed slot into system_log for traceability
    INSERT INTO system_log (type, title, description)
    VALUES (
      'ATTENDANCE_STATE',
      'Marked slot ' || slot_record.id || ' (' || slot_record.end_time || ')',
      CASE 
        WHEN has_any_attendance THEN 'Slot processed with attendance (PRESENT/ABSENT)'
        ELSE 'Slot processed with no attendance (CANCELLED)'
      END
    );

    -- ✅ Unlock after slot processed
    PERFORM pg_advisory_unlock(slot_record.id::bigint);
  END LOOP;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.mark_attendance_state()
IS 'Triggered by cron job every 2 minutes. Marks attendance state for each slot after it ends (PRESENT, ABSENT, or CANCELLED).';
