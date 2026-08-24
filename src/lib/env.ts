/**
 * Centralized Environment Configuration & Validation for CheFu-Account
 */

export interface MissingVariable {
  name: string;
  description?: string;
  isClientSide?: boolean;
  app?: string;
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

  static formatErrorMessage(missing: MissingVariable[], app = 'CheFu-Account'): string {
    if (missing.length === 0) {
      return `[${app}] Configuration Error: An unknown configuration error occurred.`;
    }

    const hint = `Set these in your Vercel project → Settings → Environment Variables for "${app}", then redeploy.`;

    if (missing.length === 1) {
      const item = missing[0];
      const desc = item.description ? ` — ${item.description}` : '';
      return `[${app}] Configuration Error: ${item.name}${desc} is not configured.\n\n${hint}`;
    }

    const lines: string[] = [
      `[${app}] Configuration Error: The following required environment variables are missing:\n`,
    ];

    for (const item of missing) {
      const desc = item.description ? ` — ${item.description}` : '';
      const side = item.isClientSide ? ' [client-side: must be set before build]' : '';
      lines.push(`  * ${item.name}${desc}${side}`);
    }

    lines.push(`\n${hint}`);
    return lines.join('\n').trim();
  }

  static fromMissing(missing: MissingVariable[], app?: string): ConfigurationError {
    return new ConfigurationError(this.formatErrorMessage(missing, app), missing);
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

  // In production, require actual Firebase keys and reject placeholder/dev values
  if (!apiKey) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_API_KEY', description: 'not set', isClientSide: true });
  } else if (isProduction && apiKey === 'local-development-key') {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_API_KEY', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (!authDomain) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', description: 'not set', isClientSide: true });
  } else if (isProduction && authDomain.includes('.local.')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (!projectId) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', description: 'not set', isClientSide: true });
  } else if (isProduction && projectId.includes('-local')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (!storageBucket) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', description: 'not set', isClientSide: true });
  } else if (isProduction && storageBucket.includes('-local.')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (!messagingSenderId) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', description: 'not set', isClientSide: true });
  } else if (isProduction && messagingSenderId === '000000000000') {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (!appId) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_APP_ID', description: 'not set', isClientSide: true });
  } else if (isProduction && appId.includes(':000000000000:')) {
    missing.push({ name: 'NEXT_PUBLIC_FIREBASE_APP_ID', description: 'still set to dev placeholder', isClientSide: true });
  }

  if (missing.length > 0) {
    return {
      isValid: false,
      config: null,
      error: ConfigurationError.fromMissing(missing, 'CheFu-Account'),
      missing: missing.map(m => m.name),
    };
  }

  const config: FirebaseClientConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
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
      throw result.error ||
        new ConfigurationError(
          '[CheFu-Account] Invalid Firebase client configuration.',
        );
    }
    console.warn(`[CheFu-Account][Firebase Config Warning] ${result.error?.message}`);
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
