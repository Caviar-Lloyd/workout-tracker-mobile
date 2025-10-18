import { supabase } from './client';

let isLoggingError = false; // Prevent infinite loops

export async function logErrorToSupabase(error: any, context: {
  screen?: string;
  userEmail?: string;
  action?: string;
  additionalInfo?: any;
}) {
  // CRITICAL: Prevent infinite error logging loops
  if (isLoggingError) {
    console.log('⚠️  Skipping error log to prevent loop');
    return;
  }

  try {
    isLoggingError = true;

    const errorData = {
      error_message: error?.message || String(error),
      error_stack: error?.stack || null,
      screen_name: context.screen || 'Unknown',
      user_email: context.userEmail || null,
      action: context.action || null,
      additional_info: context.additionalInfo ? JSON.stringify(context.additionalInfo) : null,
      created_at: new Date().toISOString(),
    };

    console.log('📊 Logging error to Supabase:');
    console.log('  - Screen:', errorData.screen_name);
    console.log('  - Action:', errorData.action);
    console.log('  - Error:', errorData.error_message);

    const { error: insertError } = await supabase
      .from('error_logs')
      .insert(errorData);

    if (insertError) {
      // Log to console but DO NOT recursively call logErrorToSupabase
      console.error('❌ Failed to insert error log (not retrying):', insertError.message);
    } else {
      console.log('✅ Error logged successfully');
    }
  } catch (loggingError) {
    // Silently fail - DO NOT create error loops
    console.error('❌ Error in error logging (not retrying):', String(loggingError));
  } finally {
    // Reset flag after a short delay
    setTimeout(() => {
      isLoggingError = false;
    }, 1000);
  }
}
