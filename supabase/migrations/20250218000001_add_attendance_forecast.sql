-- Migration: Add attendance forecasting support
-- Adds attendance_forecast table and updates daily_user_performance table

-- Create attendance_forecast table for historical forecast tracking
CREATE TABLE IF NOT EXISTS public.attendance_forecast (
    id bigint GENERATED ALWAYS AS IDENTITY NOT NULL,
    user_id text NOT NULL,
    forecast_date date NOT NULL,
    probability numeric NOT NULL CHECK (probability >= 0 AND probability <= 1),
    confidence numeric CHECK (confidence >= 0 AND confidence <= 100),
    factors jsonb DEFAULT '[]'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    CONSTRAINT attendance_forecast_pkey PRIMARY KEY (id),
    CONSTRAINT attendance_forecast_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.user(id) ON DELETE CASCADE,
    CONSTRAINT attendance_forecast_user_date_unique UNIQUE (user_id, forecast_date)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_attendance_forecast_user_id ON public.attendance_forecast(user_id);
CREATE INDEX IF NOT EXISTS idx_attendance_forecast_date ON public.attendance_forecast(forecast_date);
CREATE INDEX IF NOT EXISTS idx_attendance_forecast_created_at ON public.attendance_forecast(created_at);

-- Update daily_user_performance table to include forecast fields
ALTER TABLE public.daily_user_performance
    ADD COLUMN IF NOT EXISTS attendance_forecast_probability numeric CHECK (attendance_forecast_probability >= 0 AND attendance_forecast_probability <= 1),
    ADD COLUMN IF NOT EXISTS attendance_forecast_confidence numeric CHECK (attendance_forecast_confidence >= 0 AND attendance_forecast_confidence <= 100),
    ADD COLUMN IF NOT EXISTS attendance_forecast_factors jsonb DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS forecast_date date;

-- Add index for forecast_date in daily_user_performance
CREATE INDEX IF NOT EXISTS idx_daily_user_performance_forecast_date ON public.daily_user_performance(forecast_date);

-- Add comment to explain the new fields
COMMENT ON COLUMN public.attendance_forecast.probability IS 'Predicted attendance probability (0-1) for the forecast_date';
COMMENT ON COLUMN public.attendance_forecast.confidence IS 'Model confidence score (0-100)';
COMMENT ON COLUMN public.daily_user_performance.attendance_forecast_probability IS 'ML-predicted attendance probability (0-1) for next day';
COMMENT ON COLUMN public.daily_user_performance.forecast_date IS 'Date for which the forecast was made';

