import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
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
  up: _up = true,
}: {
  onEdit: () => void;
  onDelete: () => void;
  up?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState<React.CSSProperties>({});
  const ref = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const positionMenu = () => {
    const button = ref.current?.querySelector('button');
    if (!button) return;

    const rect = button.getBoundingClientRect();
    const menuWidth = 144;
    const menuHeight = 88;
    const gap = 6;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow > menuHeight + gap ? rect.bottom + gap : Math.max(gap, rect.top - menuHeight - gap);

    setMenuStyle({
      position: 'fixed',
      top,
      left: Math.max(gap, Math.min(rect.right - menuWidth, window.innerWidth - menuWidth - gap)),
      width: menuWidth,
      zIndex: 99999,
    });
  };

  useEffect(() => {
    function close(event: MouseEvent) {
      const target = event.target as Node;
      if (
        ref.current &&
        !ref.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
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
        onClick={() => {
          positionMenu();
          setOpen((value) => !value);
        }}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#0d3660] bg-[#041526]/70 text-slate-300 transition hover:border-cyan-400 hover:text-white"
        aria-label="Open row actions"
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open && createPortal(
        <div ref={menuRef} style={menuStyle} className="overflow-hidden rounded-lg border border-[#0d3660] bg-[#031426] p-1 text-left shadow-2xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-slate-100 hover:bg-[#071f35]"
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
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-red-300 hover:bg-red-500/10"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
        </div>,
        document.body,
      )}
    </div>
  );
}
