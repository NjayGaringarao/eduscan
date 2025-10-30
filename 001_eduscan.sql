-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.announcement (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  title text,
  message text,
  recipient text,
  created_at timestamp without time zone,
  CONSTRAINT announcement_pkey PRIMARY KEY (id)
);
CREATE TABLE public.attendance_log (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  action text NOT NULL CHECK (action = ANY (ARRAY['TIME_IN'::text, 'TIME_OUT'::text])),
  CONSTRAINT attendance_log_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_log_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.attendance_state (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text NOT NULL,
  mark text NOT NULL CHECK (mark = ANY (ARRAY['PRESENT'::text, 'ABSENT'::text, 'CANCELLED'::text])),
  marked_at timestamp with time zone NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT attendance_state_pkey PRIMARY KEY (id),
  CONSTRAINT attendance_state_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.config (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  key text NOT NULL UNIQUE,
  value text NOT NULL,
  CONSTRAINT config_pkey PRIMARY KEY (id)
);
CREATE TABLE public.employee (
  user_id text NOT NULL,
  type text,
  division text,
  title text,
  contact_number text,
  CONSTRAINT employee_pkey PRIMARY KEY (user_id),
  CONSTRAINT employee_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.guardian (
  user_id text NOT NULL,
  first_name text NOT NULL,
  sex text CHECK (sex = ANY (ARRAY['MALE'::text, 'FEMALE'::text])),
  address text,
  contact_number text,
  middle_name text,
  last_name text,
  CONSTRAINT guardian_pkey PRIMARY KEY (user_id),
  CONSTRAINT guardian_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.schedule (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  name text NOT NULL,
  description text,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['STUDENT'::text, 'EMPLOYEE'::text])),
  is_active boolean DEFAULT true,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT schedule_pkey PRIMARY KEY (id)
);
CREATE TABLE public.session (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  user_id text,
  arrival timestamp with time zone NOT NULL DEFAULT now(),
  departure timestamp with time zone,
  punctuality integer,
  duration interval,
  undertime interval,
  remarks text CHECK (remarks = ANY (ARRAY['ON_TIME'::text, 'LATE'::text, 'EARLY'::text, 'UNSCHEDULED'::text])),
  is_active boolean DEFAULT true,
  CONSTRAINT session_pkey PRIMARY KEY (id),
  CONSTRAINT session_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.slot (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  schedule_id bigint NOT NULL,
  day_of_week integer NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  label text,
  CONSTRAINT slot_pkey PRIMARY KEY (id),
  CONSTRAINT schedule_slot_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedule(id)
);
CREATE TABLE public.student (
  user_id text NOT NULL,
  department text,
  program text,
  CONSTRAINT student_pkey PRIMARY KEY (user_id),
  CONSTRAINT student_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id)
);
CREATE TABLE public.system_log (
  id integer GENERATED ALWAYS AS IDENTITY NOT NULL UNIQUE,
  timestamp timestamp with time zone DEFAULT now(),
  type text,
  title text,
  description text,
  CONSTRAINT system_log_pkey PRIMARY KEY (id)
);
CREATE TABLE public.user (
  id text NOT NULL,
  first_name text NOT NULL,
  picture_id text,
  sex text CHECK (sex = ANY (ARRAY['MALE'::text, 'FEMALE'::text])),
  birth_date date,
  address text,
  facial_encoding ARRAY,
  last_name text,
  middle_name text,
  schedule_id bigint,
  CONSTRAINT user_pkey PRIMARY KEY (id),
  CONSTRAINT user_schedule_id_fkey FOREIGN KEY (schedule_id) REFERENCES public.schedule(id)
);