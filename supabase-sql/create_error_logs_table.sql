-- Error Logging Table for Production App Monitoring
-- This table captures all errors, crashes, and failed operations for debugging

CREATE TABLE IF NOT EXISTS error_logs (
  -- Primary Key
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- User Information
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,

  -- Error Details
  error_type TEXT NOT NULL,           -- 'mutation_failed', 'query_failed', 'app_crash', 'offline_sync_failed', etc.
  error_message TEXT NOT NULL,
  error_stack TEXT,

  -- Context (What was happening when error occurred)
  screen_name TEXT,                   -- Which screen: 'DashboardScreen', 'ClientsScreen', etc.
  action TEXT,                        -- What action: 'save_workout', 'load_clients', 'update_profile', etc.

  -- Device & Network Information
  device_os TEXT,                     -- 'Android', 'iOS'
  app_version TEXT,                   -- '2.0.3', '2.1.0', etc.
  is_online BOOLEAN,                  -- Was device online when error occurred?
  network_type TEXT,                  -- 'wifi', 'cellular', 'none'

  -- Additional Context
  metadata JSONB DEFAULT '{}'::jsonb, -- Any extra data (workout data, mutation variables, etc.)

  -- Resolution Tracking
  resolved BOOLEAN DEFAULT FALSE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by TEXT,
  resolution_notes TEXT
);

-- Indexes for Fast Queries
CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_email ON error_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_error_type ON error_logs(error_type);
CREATE INDEX IF NOT EXISTS idx_error_logs_unresolved ON error_logs(resolved) WHERE resolved = FALSE;
CREATE INDEX IF NOT EXISTS idx_error_logs_screen ON error_logs(screen_name);

-- Row Level Security (RLS)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own errors (or anonymous errors)
CREATE POLICY "Users can insert their own errors"
  ON error_logs FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Policy: Admins/Coaches can view all errors (replace with your admin email)
CREATE POLICY "Admins can view all errors"
  ON error_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.email = auth.email()
      AND clients.is_coach = true
    )
  );

-- Policy: Admins can update errors (mark as resolved)
CREATE POLICY "Admins can update errors"
  ON error_logs FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM clients
      WHERE clients.email = auth.email()
      AND clients.is_coach = true
    )
  );

-- Helper View: Recent Unresolved Errors
CREATE OR REPLACE VIEW recent_unresolved_errors AS
  SELECT
    id,
    created_at,
    user_email,
    error_type,
    error_message,
    screen_name,
    action,
    app_version,
    is_online,
    network_type
  FROM error_logs
  WHERE resolved = FALSE
  ORDER BY created_at DESC
  LIMIT 100;

-- Helper View: Error Summary by Type
CREATE OR REPLACE VIEW error_summary_by_type AS
  SELECT
    error_type,
    COUNT(*) as total_count,
    COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_count,
    MAX(created_at) as last_occurrence
  FROM error_logs
  GROUP BY error_type
  ORDER BY total_count DESC;

-- Helper View: Error Summary by User
CREATE OR REPLACE VIEW error_summary_by_user AS
  SELECT
    user_email,
    COUNT(*) as total_errors,
    COUNT(CASE WHEN resolved = FALSE THEN 1 END) as unresolved_errors,
    MAX(created_at) as last_error
  FROM error_logs
  WHERE user_email IS NOT NULL
  GROUP BY user_email
  ORDER BY total_errors DESC;

-- Comments for Documentation
COMMENT ON TABLE error_logs IS 'Stores all application errors, crashes, and failed operations for monitoring and debugging';
COMMENT ON COLUMN error_logs.error_type IS 'Type of error: mutation_failed, query_failed, app_crash, offline_sync_failed, etc.';
COMMENT ON COLUMN error_logs.metadata IS 'JSON object with additional context like mutation data, query parameters, etc.';
COMMENT ON COLUMN error_logs.resolved IS 'Whether the error has been investigated and fixed';
