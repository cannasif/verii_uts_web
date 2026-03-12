import { apiClient } from '@/lib/api-client';
import type { PagedApiResponse, PagedRequest } from '@/types/api';

export interface UtsVermeListItem {
  chk: number;
  siraNo?: number | null;
  bno?: string | null;
  sira?: number | null;
  git?: string | null;
  kun?: string | null;
  uno?: string | null;
  lsNo?: string | null;
  adt?: number | null;
  sinif: string;
  seriMiLotMu: string;
  cariKodu: string;
  cariIsim?: string | null;
  stokKodu: string;
  stokAdi?: string | null;
  utsDurum: string;
  uretimLsNo?: string | null;
  utrh?: string | null;
  strh?: string | null;
  depoKod?: number | null;
  olcuBr?: number | null;
  stharGcMik?: number | null;
  straInc?: number | null;
  imalIthal?: string | null;
  uretimBildirimi: string;
}

export async function searchUtsVermeList(request: PagedRequest) {
  return apiClient.post<never, PagedApiResponse<UtsVermeListItem>>('/api/uts-verme-list/search', request);
}
