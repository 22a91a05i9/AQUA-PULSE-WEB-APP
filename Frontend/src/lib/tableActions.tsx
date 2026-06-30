import { useEffect, useRef, useState } from 'react';
import { Edit2, MoreVertical, Trash2 } from 'lucide-react';

export function exportRowsToCsv(filename: string, rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;

  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(','),
    ...rows.map((row) =>
      headers
        .map((header) => {
          const value = row[header] ?? '';
          return `"${String(value).replace(/"/g, '""')}"`;
        })
        .join(','),
    ),
  ].join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function rowMatchesSearch(row: unknown[], query: string) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return row.some((value) => String(value ?? '').toLowerCase().includes(normalized));
}

export function RowActionMenu({
  onEdit,
  onDelete,
  up = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#0d3660] text-slate-300 transition hover:border-cyan-400 hover:text-white"
        aria-label="Open row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && (
        <div className={`absolute right-0 z-50 min-w-36 overflow-hidden rounded-lg border border-[#0d3660] bg-[#031426] py-1 text-left shadow-xl ${
          up ? 'bottom-full mb-1' : 'top-10'
        }`}>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-[#071f35]"
          >
            <Edit2 className="h-4 w-4 text-cyan-300" />
            Edit
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            className="flex w-full items-center gap-2 px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
