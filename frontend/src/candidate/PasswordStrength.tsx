type Props = {
  value: string;
};

export type PasswordStrengthLevel = 'weak' | 'medium' | 'strong';

export function evaluatePasswordStrength(value: string): {
  level: PasswordStrengthLevel;
  score: number;
  checks: { minLength: boolean; hasUppercase: boolean; hasDigit: boolean };
} {
  const checks = {
    minLength: value.length >= 8,
    hasUppercase: /[A-Z]/.test(value),
    hasDigit: /\d/.test(value),
  };
  const score = Number(checks.minLength) + Number(checks.hasUppercase) + Number(checks.hasDigit);
  const level: PasswordStrengthLevel = score <= 1 ? 'weak' : score === 2 ? 'medium' : 'strong';
  return { level, score, checks };
}

export function PasswordStrength({ value }: Props) {
  const { level, score, checks } = evaluatePasswordStrength(value);
  const pct = Math.max(10, Math.min(100, (score / 3) * 100));
  const color = level === 'strong' ? 'bg-emerald-500' : level === 'medium' ? 'bg-amber-500' : 'bg-red-500';
  const label = level === 'strong' ? 'Сильный' : level === 'medium' ? 'Средний' : 'Слабый';

  const itemClass = (ok: boolean) => `text-xs ${ok ? 'text-emerald-700' : 'text-slate-500'}`;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-xs">
        <span className="text-slate-500">Сложность пароля</span>
        <span className={level === 'strong' ? 'text-emerald-700' : level === 'medium' ? 'text-amber-700' : 'text-red-700'}>
          {label}
        </span>
      </div>
      <div className="h-2 rounded bg-slate-200 overflow-hidden">
        <div className={`h-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="space-y-1">
        <div className={itemClass(checks.minLength)}>{checks.minLength ? '✓' : '•'} минимум 8 символов</div>
        <div className={itemClass(checks.hasUppercase)}>{checks.hasUppercase ? '✓' : '•'} одна заглавная буква</div>
        <div className={itemClass(checks.hasDigit)}>{checks.hasDigit ? '✓' : '•'} одна цифра</div>
      </div>
    </div>
  );
}
