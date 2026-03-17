const fallbackBaseUrl =
  (typeof import.meta !== 'undefined' && typeof import.meta.env !== 'undefined' && (import.meta.env as Record<string, string>).VITE_API_BASE_URL?.trim()) ||
  'http://localhost:5001';

export interface AppConfig {
  apiBaseUrl: string;
}

let config: AppConfig | null = null;

export function getConfig(): AppConfig {
  return config ?? { apiBaseUrl: fallbackBaseUrl };
}

export function getApiBaseUrl(): string {
  return getConfig().apiBaseUrl;
}

export async function loadConfig(): Promise<AppConfig> {
  if (config) return config;
  try {
    const base = typeof window !== 'undefined' ? window.location.origin : '';
    const res = await fetch(`${base}/config.json`, { cache: 'no-store' });
    if (res.ok) {
      const data = (await res.json()) as AppConfig;
      config = {
        apiBaseUrl: (data.apiBaseUrl ?? fallbackBaseUrl).trim() || fallbackBaseUrl,
      };
      return config;
    }
  } catch {
    // ignore
  }
  config = { apiBaseUrl: fallbackBaseUrl };
  return config;
}
