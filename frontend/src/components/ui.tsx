import React from 'react';

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
    <div className="flex items-start justify-between mb-6">
      <div>
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ── Toast ── */
export function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error'; onClose: () => void }) {
  React.useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg text-sm font-medium border
      ${type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
      <span>{type === 'success' ? '✓' : '✕'}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 text-lg leading-none">×</button>
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
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg border border-slate-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 text-xl leading-none">×</button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>
  );
}
