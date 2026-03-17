import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UtsUretimListItem {
  chk: string;
  siraNo: number;
  bno?: string | null;
  sira: number;
  git?: string | null;
  uno?: string | null;
  lsNo: string;
  adt?: number | null;
  sinif: string;
  seriMiLotMu: string;
  stokKodu: string;
  stokAdi?: string | null;
  urt?: string | null;
  skt?: string | null;
  utsDurum: string;
}

export async function getAllUtsUretimList() {
  return apiClient.get<never, ApiResponse<UtsUretimListItem[]>>('/api/uts-uretim-list');
}
