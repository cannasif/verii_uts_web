import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

export interface UtsIthalatListItem {
  chk: string;
  siraNo: number;
  bno: string | null;
  sira: number | null;
  git: string | null;
  kun: string | null;
  uno: string | null;
  lsNo: string;
  adt: number | null;
  sinif: string;
  seriMiLotMu: string;
  cariKodu: string;
  cariIsim: string | null;
  stokKodu: string;
  stokAdi: string | null;
  utsDurum: string;
  uretimLsNo: string | null;
  urt: string | null;
  skt: string | null;
  depoKod: number | null;
  olcuBr: number | null;
  stharGcMik: number | null;
  straInc: number | null;
  imalIthal: string | null;
  gbn: string | null;
  ieu: string | null;
  meu: string | null;
  udi: number | null;
}

export async function getAllUtsIthalatList() {
  return apiClient.get<never, ApiResponse<UtsIthalatListItem[]>>('/api/uts-ithalat-list');
}
