DROP FUNCTION IF EXISTS public.mark_attendance_state();

CREATE OR REPLACE FUNCTION public.mark_attendance_state()
RETURNS void AS $$
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
BEGIN
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
   
    PERFORM pg_advisory_lock(slot_record.id::bigint);

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

    slot_start_time := ((current_manila_date + slot_record.start_time)::timestamp) AT TIME ZONE 'Asia/Manila';
    slot_end_time   := ((current_manila_date + slot_record.end_time)::timestamp) AT TIME ZONE 'Asia/Manila';

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
      IF has_any_attendance THEN

        FOR user_record IN
          SELECT u.id
          FROM "user" u
          WHERE u.schedule_id = slot_record.schedule_id
        LOOP
          BEGIN
            IF EXISTS(
              SELECT 1
              FROM attendance_log al
              WHERE al.user_id = user_record.id
                AND al.action = 'TIME_IN'
                AND al.timestamp >= (slot_start_time - (grace_period_minutes || ' minutes')::interval)
                AND al.timestamp <= (slot_end_time + (grace_period_minutes || ' minutes')::interval)
            ) THEN
              INSERT INTO attendance_state (user_id, mark, marked_at)
              SELECT user_record.id, 'PRESENT', slot_end_time
              WHERE NOT EXISTS (
                SELECT 1 FROM attendance_state
                WHERE user_id = user_record.id
                  AND marked_at::date = current_manila_date
                  AND DATE_TRUNC('minute', marked_at::time) = DATE_TRUNC('minute', slot_record.end_time)
              );
            ELSE
              INSERT INTO attendance_state (user_id, mark, marked_at)
              SELECT user_record.id, 'ABSENT', slot_end_time
              WHERE NOT EXISTS (
                SELECT 1 FROM attendance_state
                WHERE user_id = user_record.id
                  AND marked_at::date = current_manila_date
                  AND DATE_TRUNC('minute', marked_at::time) = DATE_TRUNC('minute', slot_record.end_time)
              );
            END IF;
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO system_log (type, title, description)
            VALUES ('ERROR', 'User insert failed', 'Slot ' || slot_record.id || ', User ' || user_record.id || ': ' || SQLERRM);
          END;
        END LOOP;

        -- Log the processing of the slot
       INSERT INTO system_log (type, title, description)
       VALUES (
        'SYSTEM.ATTENDANCE',
        'Attendance Marked Successfully',
        'Attendance state for each user that is associated with the schedule with slot_id: ' || slot_record.id || ' has been ABSENT/PRESENT marked.'
      );

      ELSE

        FOR user_record IN
          SELECT u.id
          FROM "user" u
          WHERE u.schedule_id = slot_record.schedule_id
        LOOP
          BEGIN
            INSERT INTO attendance_state (user_id, mark, marked_at)
            SELECT user_record.id, 'CANCELLED', slot_end_time
            WHERE NOT EXISTS (
              SELECT 1 FROM attendance_state
              WHERE user_id = user_record.id
                AND marked_at::date = current_manila_date
                AND DATE_TRUNC('minute', marked_at::time) = DATE_TRUNC('minute', slot_record.end_time)
            );
          EXCEPTION WHEN OTHERS THEN
            INSERT INTO system_log (type, title, description)
            VALUES ('ERROR', 'Cancelled insert failed', 'Slot ' || slot_record.id || ', User ' || user_record.id || ': ' || SQLERRM);
          END;
        END LOOP;

        -- Log the cancellation of the attendance for the slot
        INSERT INTO system_log (type, title, description)
        VALUES ('SYSTEM.ATTENDANCE', 'Attendance Marked Cancelled', 'Attendance state for each user that is associated with the schedule with slot_id: ' || slot_record.id || ' has been CANCELLED marked due to no attendance.');
      END IF;
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO system_log (type, title, description)
      VALUES ('ERROR', 'Slot processing failed', 'Slot ' || slot_record.id || ': ' || SQLERRM);
    END;

    UPDATE slot 
    SET marked_at = slot_end_time
    WHERE id = slot_record.id;


    PERFORM pg_advisory_unlock(slot_record.id::bigint);
  END LOOP;

EXCEPTION WHEN OTHERS THEN
  INSERT INTO system_log (type, title, description)
  VALUES ('ERROR', 'Function failed', SQLERRM);
END;
$$ LANGUAGE plpgsql;