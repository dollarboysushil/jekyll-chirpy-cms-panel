/**
 * Environment validation - run on application startup
 */

import { validateEnvironment } from './validation';

let validated = false;

export function ensureEnvironmentVariables(): void {
  // Only validate once
  if (validated) return;
  
  const result = validateEnvironment();
  
  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach(error => {
      console.error(`  - ${error}`);
    });
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Missing required environment variables. Please check your configuration.');
    } else {
      console.warn('⚠️  Missing environment variables in development mode. Some features may not work.');
    }
  } else {
    console.log('✅ Environment variables validated successfully');
  }
  
  validated = true;
}

// Auto-validate on import in production
if (process.env.NODE_ENV === 'production') {
  try {
    ensureEnvironmentVariables();
  } catch (error) {
    console.error('Failed to validate environment:', error);
  }
}
