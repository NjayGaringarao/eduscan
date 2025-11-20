DROP FUNCTION IF EXISTS update_user;

CREATE OR REPLACE FUNCTION update_user(
  p_user jsonb,
  p_organizational jsonb,
  p_guardian jsonb,
  p_facial_encoding double precision[]
)
RETURNS void AS $$
DECLARE
  v_role text;
  v_user_id text := p_organizational->>'user_id';
BEGIN
  PERFORM pg_advisory_xact_lock(1);

  UPDATE "user"
  SET
    first_name      = p_user->>'first_name',
    middle_name     = p_user->>'middle_name',
    last_name       = p_user->>'last_name',
    sex             = upper(p_user->>'sex'),
    birth_date      = (p_user->>'birth_date')::date,
    address         = p_user->>'address',
    facial_encoding = p_facial_encoding
  WHERE id = v_user_id;

  IF EXISTS (SELECT 1 FROM student WHERE user_id = v_user_id) THEN
    v_role := 'STUDENT';
  ELSIF EXISTS (SELECT 1 FROM employee WHERE user_id = v_user_id) THEN
    v_role := 'EMPLOYEE';
  END IF;

  IF p_organizational->>'role' = 'STUDENT' THEN
    IF v_role = 'STUDENT' THEN
      UPDATE student
      SET department = p_organizational->>'department',
          program    = p_organizational->>'program'
      WHERE user_id = v_user_id;
    ELSE
      DELETE FROM employee WHERE user_id = v_user_id;
      INSERT INTO student (user_id, department, program)
      VALUES (
        v_user_id,
        p_organizational->>'department',
        p_organizational->>'program'
      );
    END IF;

  ELSIF p_organizational->>'role' = 'EMPLOYEE' THEN
    IF v_role = 'EMPLOYEE' THEN
      UPDATE employee
      SET
        type = p_organizational->>'type',
        division = p_organizational->>'division',
        title = p_organizational->>'title',
        contact_number = p_organizational->>'contact_number'
      WHERE user_id = v_user_id;
    ELSE
      DELETE FROM student WHERE user_id = v_user_id;
      INSERT INTO employee (user_id, type, division, title, contact_number)
      VALUES (
        v_user_id,
        p_organizational->>'type',
        p_organizational->>'division',
        p_organizational->>'title',
        p_organizational->>'contact_number'
      );
    END IF;
  END IF;

  IF p_guardian IS NOT NULL THEN
    INSERT INTO guardian (
      user_id, first_name, middle_name, last_name, sex, address, contact_number
    )
    VALUES (
      v_user_id,
      p_guardian->>'first_name',
      p_guardian->>'middle_name',
      p_guardian->>'last_name',
      upper(p_guardian->>'sex'),
      p_guardian->>'address',
      p_guardian->>'contact_number'
    )
    ON CONFLICT (user_id) DO UPDATE
      SET first_name = excluded.first_name,
          middle_name = excluded.middle_name,
          last_name = excluded.last_name,
          sex = excluded.sex,
          address = excluded.address,
          contact_number = excluded.contact_number;
  ELSE
    DELETE FROM guardian WHERE user_id = v_user_id;
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
