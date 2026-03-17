import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UtsAlmaListItem {
  chk: string;
  siraNo: number | null;
  bno: string | null;
  sira: number | null;
  git: string | null;
  kun: string | null;
  uno: string | null;
  lsNo: string | null;
  adt: number | null;
  sinif: string;
  seriMiLotMu: string;
  cariKodu: string;
  cariIsim: string | null;
  stokKodu: string;
  stokAdi: string | null;
  acik16: string | null;
  utsDurum: string;
}

export async function getAllUtsAlmaList() {
  return apiClient.get<never, ApiResponse<UtsAlmaListItem[]>>('/api/uts-alma-list');
}
