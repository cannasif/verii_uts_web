import { Pencil } from 'lucide-react';
import { toast } from 'sonner';
import type { DataGridColumn } from '@/components/shared/data-grid';
import { cn } from '@/lib/utils';

/** Fallback label for UTS-style rows when editing from grid (toast / future forms). */
export function getUtsGridRowLabel(row: unknown): string {
  const r = row as Record<string, unknown>;
  const v = r.stokAdi ?? r.stokKodu ?? r.uno ?? r.cariIsim ?? r.cariKodu ?? r.git ?? r.chk ?? r.bno ?? r.lsNo ?? r.adt;
  return String(v ?? '').trim();
}

export function createDataGridEditActionsColumn<TRow>(options: {
  label: string;
  editTitle: string;
  comingSoonMessage: string;
  isLight: boolean;
  rowLabel: (row: TRow) => string;
  onEdit?: (row: TRow) => void;
  className?: string;
}): DataGridColumn<TRow> {
  const { label, editTitle, comingSoonMessage, isLight, rowLabel, onEdit, className } = options;

  return {
    key: 'actions',
    label,
    className: cn(isLight ? 'w-[84px] text-right' : 'w-[76px] text-right', className),
    render: (row) => (
      <div className="flex items-center justify-end gap-1.5">
        <button
          type="button"
          className={cn(
            'rounded-lg border p-1.5 transition',
            isLight
              ? 'border-indigo-200/70 bg-white/70 text-indigo-700 hover:bg-indigo-50'
              : 'border-cyan-300/30 bg-[#1a132b]/70 text-cyan-200 hover:border-cyan-300/60 hover:text-cyan-100',
          )}
          title={editTitle}
          onClick={() => {
            if (onEdit) {
              onEdit(row);
              return;
            }
            const name = rowLabel(row);
            toast.info(name ? `${name} - ${comingSoonMessage}` : comingSoonMessage);
          }}
        >
          <Pencil className="size-3.5" />
        </button>
      </div>
    ),
    exportValue: () => '',
  };
}
