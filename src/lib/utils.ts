import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { getApiBaseUrl } from '@/lib/app-config';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(value: string | Date) {
  const date = typeof value === 'string' ? new Date(value) : value;
  return new Intl.DateTimeFormat('tr-TR', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date);
}

export function buildAssetUrl(path?: string | null) {
  if (!path) return undefined;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  return `${getApiBaseUrl()}${path}`;
}
