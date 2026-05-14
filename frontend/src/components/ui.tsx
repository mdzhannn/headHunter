import * as React from 'react';

/* ── Button ── */
interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'success';
  size?: 'sm' | 'md';
}
export function Btn({ variant = 'ghost', size = 'md', className = '', ...p }: BtnProps) {
  const base = 'inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all duration-150 cursor-pointer disabled:opacity-40';
  const sz = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';
  const v = {
    primary: 'bg-indigo-600 border-indigo-600 text-white hover:bg-indigo-700',
    danger:  'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
    ghost:   'bg-white border-slate-200 text-slate-700 hover:bg-slate-50',
  }[variant];
  return <button className={`${base} ${sz} ${v} ${className}`} {...p} />;
}

/* ── Input ── */
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}
export function Input({ label, error, className = '', ...p }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
      <input
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition
          border-slate-200 text-slate-800 placeholder-slate-400
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
          ${error ? 'border-red-400' : ''} ${className}`}
        {...p}
      />
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}

/* ── PhoneInput ── */
interface PhoneInputProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}
export function PhoneInput({ label, value, onChange, disabled, className = '' }: PhoneInputProps) {
  const PREFIX = '+7';
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.currentTarget.value;
    // Strip everything except digits from the part after +7
    if (!raw.startsWith(PREFIX)) {
      const digits = raw.replace(/\D/g, '');
      onChange(PREFIX + digits);
      return;
    }
    const afterPrefix = raw.slice(PREFIX.length).replace(/\D/g, '');
    onChange(PREFIX + afterPrefix);
  };
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Prevent deleting the +7 prefix
    const input = e.currentTarget;
    if ((e.key === 'Backspace' || e.key === 'Delete') && input.selectionStart !== null && input.selectionStart <= PREFIX.length && input.selectionEnd !== null && input.selectionEnd <= PREFIX.length) {
      e.preventDefault();
    }
  };
  const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    const input = e.currentTarget;
    if (input.selectionStart !== null && input.selectionStart < PREFIX.length) {
      setTimeout(() => input.setSelectionRange(PREFIX.length, PREFIX.length), 0);
    }
  };
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    if (e.currentTarget.selectionStart !== null && e.currentTarget.selectionStart < PREFIX.length) {
      e.currentTarget.setSelectionRange(PREFIX.length, PREFIX.length);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>}
      <input
        type="tel"
        value={value || PREFIX}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={handleFocus}
        onClick={handleClick}
        disabled={disabled}
        placeholder="+7XXXXXXXXXX"
        className={`w-full px-3 py-2 text-sm bg-white border rounded-lg outline-none transition
          border-slate-200 text-slate-800 placeholder-slate-400
          focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 ${className}`}
      />
    </div>
  );
}

/* ── Badge ── */
export function Badge({ children, color = 'slate' }: { children: React.ReactNode; color?: 'slate' | 'green' | 'red' | 'amber' | 'indigo' }) {
  const c = {
    slate:  'bg-slate-100 text-slate-600',
    green:  'bg-emerald-50 text-emerald-700',
    red:    'bg-red-50 text-red-700',
    amber:  'bg-amber-50 text-amber-700',
    indigo: 'bg-indigo-50 text-indigo-700',
  }[color];
  return <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${c}`}>{children}</span>;
}

/* ── Card ── */
export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-xl border border-slate-200 shadow-sm ${className}`}>
      {children}
    </div>
  );
}

/* ── Section Header ── */
export function SectionHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6 min-w-0">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action != null && <div className="shrink-0 w-full sm:w-auto [&>*]:max-sm:w-full">{action}</div>}
    </div>
  );
}

/* ── Toast ── */
export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div
      className={`fixed z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border left-4 right-4 mx-auto max-w-lg sm:left-auto sm:right-6 sm:mx-0 bottom-[max(1.25rem,env(safe-area-inset-bottom,0px))]
      ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}
    >
      <span className="shrink-0">{type === 'success' ? '✓' : '✕'}</span>
      <span className="min-w-0 flex-1 break-words">{message}</span>
      <button type="button" onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100 text-lg leading-none">
        ×
      </button>
    </div>
  );
}

/* ── Empty State ── */
export function Empty({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-slate-400">
      <div className="text-4xl mb-3">◎</div>
      <p className="text-sm">{label}</p>
    </div>
  );
}

/* ── Loading ── */
export function Spinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="w-6 h-6 border-2 border-indigo-300 border-t-indigo-600 rounded-full animate-spin" />
    </div>
  );
}

/* ── Modal ── */
export function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 pt-[max(1rem,env(safe-area-inset-top))] pb-[max(1rem,env(safe-area-inset-bottom))] overflow-y-auto overscroll-contain">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200 max-h-[min(90vh,100dvh)] flex flex-col min-h-0 my-auto">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-slate-100 shrink-0">
          <h3 className="font-semibold text-slate-900 min-w-0">{title}</h3>
          <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none shrink-0">
            ×
          </button>
        </div>
        <div className="px-4 sm:px-6 py-5 overflow-y-auto min-h-0">{children}</div>
      </div>
    </div>
  );
}
