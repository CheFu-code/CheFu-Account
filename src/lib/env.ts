/**
 * Centralized Environment Configuration & Validation for CheFu-Account
 */

export interface MissingVariable {
  name: string;
  description?: string;
  isClientSide?: boolean;
}

export class ConfigurationError extends Error {
  public readonly missing: MissingVariable[];
  public readonly isConfigurationError = true;

  constructor(message: string, missing: MissingVariable[] = []) {
    super(message);
    this.name = 'ConfigurationError';
    this.missing = missing;
    Object.setPrototypeOf(this, ConfigurationError.prototype);
  }

  static formatErrorMessage(missing: MissingVariable[]): string {
    if (missing.length === 0) {
      return 'Configuration Error: An unknown configuration error occurred.';
    }

    if (missing.length === 1) {
      const item = missing[0];
      const desc = item.description ? ` (${item.description})` : '';
      return `Configuration Error: ${item.name}${desc} is not configured. Please add it to your environment variables and restart the application.`;
    }

    const lines: string[] = [
      'Configuration Error: The following required environment variables are missing:\n',
    ];

    for (const item of missing) {
      const desc = item.description ? ` (${item.description})` : '';
      lines.push(`  * ${item.name}${desc}`);
    }

    lines.push('\nPlease configure the required environment variables and restart the application.');
    return lines.join('\n').trim();
  }

  static fromMissing(missing: MissingVariable[]): ConfigurationError {
    return new ConfigurationError(this.formatErrorMessage(missing), missing);
  }
}

function getEnv(name: string, env: Record<string, string | undefined> = process.env): string {
  return (env[name] || '').trim();
}

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

export function validateFirebaseClientEnv(
  env: Record<string, string | undefined> = process.env,
): { isValid: boolean; config: FirebaseClientConfig | null; error?: ConfigurationError; missing: string[] } {
  const isProduction = env.NODE_ENV === 'production';
  const missing: MissingVariable[] = [];

  const apiKey = getEnv('NEXT_PUBLIC_FIREBASE_API_KEY', env);
  const authDomain = getEnv('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', env);
  const projectId = getEnv('NEXT_PUBLIC_FIREBASE_PROJECT_ID', env);
  const storageBucket = getEnv('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', env);
  const messagingSenderId = getEnv('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', env);
  const appId = getEnv('NEXT_PUBLIC_FIREBASE_APP_ID', env);
  const measurementId = getEnv('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID', env);

  // In production, require actual Firebase keys
  if (!apiKey || (isProduction && apiKey === 'local-development-key')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_API_KEY', description: 'Firebase Web API Key', isClientSide: true });
  }
  if (!authDomain || (isProduction && authDomain.includes('.local.'))) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', description: 'Firebase Auth Domain', isClientSide: true });
  }
  if (!projectId || (isProduction && projectId.includes('-local'))) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', description: 'Firebase Project ID', isClientSide: true });
  }
  if (!storageBucket || (isProduction && storageBucket.includes('-local.'))) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', description: 'Firebase Storage Bucket', isClientSide: true });
  }
  if (!messagingSenderId || (isProduction && messagingSenderId === '000000000000')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', description: 'Firebase Cloud Messaging Sender ID', isClientSide: true });
  }
  if (!appId || (isProduction && appId.includes(':000000000000:'))) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_APP_ID', description: 'Firebase Web App ID', isClientSide: true });
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      config: null,
      error: ConfigurationError.fromMissing(missing),
      missing: missing.map(m => m.name),
    };
  }

  const config: FirebaseClientConfig = {
    apiKey: apiKey || 'local-development-key',
    authDomain: authDomain || 'chefu-inc.local.firebaseapp.com',
    projectId: projectId || 'chefu-inc-local',
    storageBucket: storageBucket || 'chefu-inc-local.appspot.com',
    messagingSenderId: messagingSenderId || '000000000000',
    appId: appId || '1:000000000000:web:0000000000000000000000',
    measurementId: measurementId || undefined,
  };

  return {
    isValid: true,
    config,
    missing: [],
  };
}

export function getFirebaseClientConfig(): FirebaseClientConfig {
  const result = validateFirebaseClientEnv();
  if (!result.isValid || !result.config) {
    if (process.env.NODE_ENV === 'production') {
      throw result.error || new ConfigurationError('Invalid Firebase client configuration.');
    }
    console.warn(`[Firebase Config Warning] ${result.error?.message}`);
    return {
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'local-development-key',
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'chefu-inc.local.firebaseapp.com',
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'chefu-inc-local',
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'chefu-inc-local.appspot.com',
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '000000000000',
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:000000000000:web:0000000000000000000000',
      measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || undefined,
    };
  }
  return result.config;
}
