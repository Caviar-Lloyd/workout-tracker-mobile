-- Clear duplicate recursive error logs
-- These were caused by an infinite loop in error tracking

-- Delete all error logs that contain recursive "Error captured" messages
DELETE FROM error_logs
WHERE error_message LIKE '%🚨 Error captured:%🚨 Error captured:%';

-- Alternative: Delete all error logs related to custom_workouts RLS policy
DELETE FROM error_logs
WHERE error_message LIKE '%new row violates row-level security policy for table%custom_workouts%';

-- Optional: Keep only the most recent 100 errors for reference
-- Uncomment if you want to truncate old errors
-- DELETE FROM error_logs
-- WHERE id NOT IN (
--   SELECT id FROM error_logs
--   ORDER BY created_at DESC
--   LIMIT 100
-- );

-- Show remaining error count
SELECT COUNT(*) as remaining_errors FROM error_logs;
