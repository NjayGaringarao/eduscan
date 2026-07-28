-- Same gap as 20250219000001, but for schedule deletion: admin's deleteSchedule
-- does a plain DELETE on schedule with no pre-cleanup, and both FKs pointing
-- at schedule.id defaulted to NO ACTION. Every schedule has slots, so this
-- was unconditionally broken. Slots belong to their schedule (cascade), but
-- users assigned to a schedule are not owned by it - unassign them instead
-- of deleting them, matching the existing unlink_user_schedule RPC's
-- SET schedule_id = NULL semantics.

ALTER TABLE public.slot DROP CONSTRAINT slot_schedule_id_fkey;
ALTER TABLE public.slot ADD CONSTRAINT slot_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedule(id) ON DELETE CASCADE;

ALTER TABLE public."user" DROP CONSTRAINT user_schedule_id_fkey;
ALTER TABLE public."user" ADD CONSTRAINT user_schedule_id_fkey
  FOREIGN KEY (schedule_id) REFERENCES public.schedule(id) ON DELETE SET NULL;
