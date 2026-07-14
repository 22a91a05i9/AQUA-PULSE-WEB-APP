import { X } from 'lucide-react';
import type { ReactNode } from 'react';

export function ProjectDialog({
  title,
  description,
  children,
  footer,
  onClose,
}: {
  title: string;
  description?: string;
  children?: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl border border-[#0d3660] bg-[#041526] p-6 text-left shadow-[0_24px_80px_rgba(0,0,0,0.45)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold text-white">{title}</h3>
            {description && <p className="mt-2 text-sm leading-6 text-slate-300">{description}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#0d3660] text-slate-300 transition hover:border-cyan-400 hover:text-white"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        {children && <div className="mt-5 space-y-4">{children}</div>}
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  );
}

export function DialogButton({
  children,
  onClick,
  tone = 'neutral',
  disabled = false,
}: {
  children: ReactNode;
  onClick: () => void;
  tone?: 'neutral' | 'primary' | 'danger';
  disabled?: boolean;
}) {
  const toneClass =
    tone === 'primary'
      ? 'border-cyan-400 bg-cyan-500/15 text-cyan-100 hover:bg-cyan-500/25'
      : tone === 'danger'
        ? 'border-red-500/40 bg-red-500/15 text-red-100 hover:bg-red-500/25'
        : 'border-[#0d3660] bg-[#020b18]/60 text-slate-200 hover:border-cyan-400';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`h-11 rounded-lg border px-5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {children}
    </button>
  );
}

export function DialogField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300"
      />
    </label>
  );
}

export function DialogSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-slate-200">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 h-11 w-full rounded-lg border border-[#0d3660] bg-[#020b18]/70 px-4 text-sm text-white outline-none transition focus:border-cyan-300"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>{option.label}</option>
        ))}
      </select>
    </label>
  );
}
