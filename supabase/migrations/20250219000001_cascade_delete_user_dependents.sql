-- The base schema created these foreign keys with no ON DELETE behavior
-- (default: NO ACTION), so deleting a user fails with a foreign key
-- violation as soon as they have even one session, attendance log, or
-- student/employee/guardian profile row. Deleting a user is meant to purge
-- all of their dependent records, so cascade instead.

ALTER TABLE public.session DROP CONSTRAINT session_user_id_fkey;
ALTER TABLE public.session ADD CONSTRAINT session_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.attendance_log DROP CONSTRAINT attendance_log_user_id_fkey;
ALTER TABLE public.attendance_log ADD CONSTRAINT attendance_log_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.employee DROP CONSTRAINT employee_user_id_fkey;
ALTER TABLE public.employee ADD CONSTRAINT employee_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.guardian DROP CONSTRAINT guardian_user_id_fkey;
ALTER TABLE public.guardian ADD CONSTRAINT guardian_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;

ALTER TABLE public.student DROP CONSTRAINT student_user_id_fkey;
ALTER TABLE public.student ADD CONSTRAINT student_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public."user"(id) ON DELETE CASCADE;
