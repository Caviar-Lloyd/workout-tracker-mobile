@echo off
REM Quick script to publish EAS Updates
cd C:\Projects\workout-tracker-app
npx eas-cli update --branch preview --message "Update from %date% %time%"
