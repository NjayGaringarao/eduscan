-- Create daily_performance_snapshot table
CREATE TABLE IF NOT EXISTS public.daily_performance_snapshot (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  snapshot_date date NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['STUDENT'::text, 'EMPLOYEE'::text, 'ALL'::text])),
  average_punctuality numeric,
  average_punctuality_label text,
  average_punctuality_trend text CHECK (average_punctuality_trend = ANY (ARRAY['improving'::text, 'declining'::text, 'stable'::text])),
  average_time_balance numeric,
  average_time_balance_label text,
  average_time_balance_trend text CHECK (average_time_balance_trend = ANY (ARRAY['improving'::text, 'declining'::text, 'stable'::text])),
  attendance_rate numeric,
  attendance_rate_label text,
  total_users integer DEFAULT 0,
  at_risk_count integer DEFAULT 0,
  not_at_risk_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_performance_snapshot_pkey PRIMARY KEY (id),
  CONSTRAINT daily_performance_snapshot_unique UNIQUE (snapshot_date, user_type)
);

-- Create daily_user_performance table
CREATE TABLE IF NOT EXISTS public.daily_user_performance (
  id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
  snapshot_date date NOT NULL,
  user_id text NOT NULL,
  user_type text NOT NULL CHECK (user_type = ANY (ARRAY['STUDENT'::text, 'EMPLOYEE'::text])),
  average_punctuality_value numeric,
  average_punctuality_label text,
  average_punctuality_trend text CHECK (average_punctuality_trend = ANY (ARRAY['improving'::text, 'declining'::text, 'stable'::text])),
  average_time_balance_value numeric,
  average_time_balance_label text,
  average_time_balance_trend text CHECK (average_time_balance_trend = ANY (ARRAY['improving'::text, 'declining'::text, 'stable'::text])),
  attendance_rate_value numeric,
  attendance_rate_label text,
  dropout_risk_level text CHECK (dropout_risk_level = ANY (ARRAY['AT_RISK'::text, 'NOT_AT_RISK'::text, 'No Data'::text])),
  dropout_risk_percentage numeric,
  dropout_risk_confidence numeric,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT daily_user_performance_pkey PRIMARY KEY (id),
  CONSTRAINT daily_user_performance_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_user_performance_snapshot_user_type ON public.daily_user_performance(snapshot_date, user_type);
CREATE INDEX IF NOT EXISTS idx_daily_user_performance_user_snapshot ON public.daily_user_performance(user_id, snapshot_date);
CREATE INDEX IF NOT EXISTS idx_daily_performance_snapshot_date ON public.daily_performance_snapshot(snapshot_date);
CREATE INDEX IF NOT EXISTS idx_daily_performance_snapshot_user_type ON public.daily_performance_snapshot(user_type);

