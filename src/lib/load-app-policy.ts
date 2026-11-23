import type { RuntimeAppPolicy } from './redirect-policy';

export async function loadAppPolicy(id: string): Promise<RuntimeAppPolicy | null> {
  if (!/^[a-z][a-z0-9-]{1,63}$/.test(id)) return null;
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.chefu.co.za').replace(/\/$/, '');
  const response = await fetch(`${base}/apps/policy/${encodeURIComponent(id)}`, { cache: 'no-store', signal: AbortSignal.timeout(4000), redirect: 'error' });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error('Application registry is unavailable.');
  const policy = await response.json() as RuntimeAppPolicy;
  if (policy.id !== id || typeof policy.name !== 'string' || !Array.isArray(policy.origins) || policy.origins.some(origin => typeof origin !== 'string') || !Array.isArray(policy.clients) || policy.clients.some(client => typeof client.id !== 'string' || !Array.isArray(client.redirectUris) || client.redirectUris.some(uri => typeof uri !== 'string'))) throw new Error('Invalid application policy.');
  return policy;
}
