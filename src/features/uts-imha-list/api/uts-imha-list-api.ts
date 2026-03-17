import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UtsImhaListItem {
  chk: string;
  siraNo: number | null;
  bno: string | null;
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
  utsDurum: string | null;
  uretimLsNo: string | null;
  depoKod: number | null;
  olcuBr: number | null;
  stharGcMik: number | null;
  straInc: number | null;
  imalIthal: string | null;
  grk: string | null;
}

export async function getAllUtsImhaList() {
  return apiClient.get<never, ApiResponse<UtsImhaListItem[]>>('/api/uts-imha-list');
}
