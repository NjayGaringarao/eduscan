-- Enable required extensions for background jobs
-- pg_cron: For scheduling periodic tasks
-- pg_net: For making HTTP requests from database functions

CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

