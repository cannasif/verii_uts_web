import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UtsIhracatListItem {
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
  utsDurum: string;
  uretimLsNo: string | null;
  depoKod: number | null;
  olcuBr: number | null;
  stharGcMik: number | null;
  straInc: number | null;
  imalIthal: string | null;
  gbn: string | null;
  uretimBildirimi: string;
}

export async function getAllUtsIhracatList() {
  return apiClient.get<never, ApiResponse<UtsIhracatListItem[]>>('/api/uts-ihracat-list');
}
