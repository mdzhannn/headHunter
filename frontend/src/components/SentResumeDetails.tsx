import type { CandidateResumeDto } from '../candidate/candidateApi';

export default function SentResumeDetails({ r }: { r: CandidateResumeDto | null | undefined }) {
  if (!r) return <p className="text-xs text-slate-500">Данные резюме недоступны.</p>;
  const fullName = [r.surname, r.name, r.patronymic].filter(Boolean).join(' ').trim() || '—';
  return (
    <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
      <p>
        <span className="text-slate-500">ФИО:</span> {fullName}
      </p>
      {r.position ? (
        <p>
          <span className="text-slate-500">Должность:</span> {r.position}
        </p>
      ) : null}
      {(r.email || r.phone) && (
        <p>
          <span className="text-slate-500">Контакты:</span> {[r.email, r.phone].filter(Boolean).join(' · ')}
        </p>
      )}
      {r.location ? (
        <p>
          <span className="text-slate-500">Локация:</span> {r.location}
        </p>
      ) : null}
      {r.salary != null && r.salary > 0 ? (
        <p>
          <span className="text-slate-500">Зарплата:</span> {r.salary.toLocaleString('ru-RU')} ₸
        </p>
      ) : null}
      {r.education ? (
        <p>
          <span className="text-slate-500">Образование:</span> {r.education}
        </p>
      ) : null}
      {r.skills ? (
        <p>
          <span className="text-slate-500">Навыки:</span> {r.skills}
        </p>
      ) : null}
      {r.workPlace ? (
        <p>
          <span className="text-slate-500">Опыт:</span> {r.workPlace}
        </p>
      ) : null}
      {r.aboutMe ? (
        <p>
          <span className="text-slate-500">О себе:</span> {r.aboutMe}
        </p>
      ) : null}
    </div>
  );
}
