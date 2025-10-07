@echo off
echo Building Expo web app...
call npx expo export --platform web

echo.
echo Deploying to Vercel...
call vercel --prod

echo.
echo Deployment complete!
echo Your app should be live at: https://app.eccentriciron.com
pause
