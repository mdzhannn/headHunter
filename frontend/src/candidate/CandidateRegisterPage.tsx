import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Btn, Input, PhoneInput, Toast } from '../components/ui';
import { candidateApi } from './candidateApi';
import { useAuth } from './AuthContext';

const hhBlue = '#2557a7';

const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Мужской' },
  { value: 'FEMALE', label: 'Женский' },
];

function PhotoPicker({
  value,
  onChange,
}: {
  value: string | null | undefined;
  onChange: (url: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Файл слишком большой. Максимум 5 МБ.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') onChange(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className="w-28 h-28 rounded-full border-2 border-dashed border-slate-300 overflow-hidden cursor-pointer hover:border-[#2557a7] transition-colors flex items-center justify-center bg-slate-50"
        onClick={() => inputRef.current?.click()}
      >
        {value ? (
          <img src={value} alt="Фото профиля" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center gap-1 text-slate-400 select-none">
            <span className="text-3xl">👤</span>
            <span className="text-xs">Загрузить</span>
          </div>
        )}
      </div>
      <button
        type="button"
        className="text-xs text-[#2557a7] hover:underline"
        onClick={() => inputRef.current?.click()}
      >
        {value ? 'Изменить фото' : 'Добавить фото'}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}

type Step1 = {
  photoUrl: string;
  name: string;
  surname: string;
  phone: string;
  position: string;
};

type Step2 = {
  age: string;
  gender: string;
  location: string;
  education: string;
  skills: string;
  workPlace: string;
  aboutMe: string;
  salary: string;
};

export default function CandidateRegisterPage() {
  const nav = useNavigate();
  const { token, role, isLoading } = useAuth();
  const [step, setStep] = useState<1 | 2>(1);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Role-based redirect: admins → admin panel, employers → employer portal,
  // returning candidates (resume already filled) → vacancies
  useEffect(() => {
    if (isLoading) return;
    if (!token) {
      nav('/app/login', { replace: true });
      return;
    }
    if (role === 'ADMIN') {
      nav('/admin/dashboard', { replace: true });
      return;
    }
    if (role === 'EMPLOYER') {
      nav('/employer', { replace: true });
      return;
    }
    candidateApi.getResume()
      .then((r) => {
        if (r.name && r.name.trim()) {
          nav('/app/vacancies', { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [isLoading, nav, role, token]);

  const [s1, setS1] = useState<Step1>({
    photoUrl: '',
    name: '',
    surname: '',
    phone: '+7',
    position: '',
  });

  const [s2, setS2] = useState<Step2>({
    age: '',
    gender: '',
    location: '',
    education: '',
    skills: '',
    workPlace: '',
    aboutMe: '',
    salary: '',
  });

  if (checking) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#2557a7]/30 border-t-[#2557a7] rounded-full animate-spin" />
      </div>
    );
  }

  const f1 = <K extends keyof Step1>(k: K, v: Step1[K]) => setS1((p) => ({ ...p, [k]: v }));
  const f2 = <K extends keyof Step2>(k: K, v: Step2[K]) => setS2((p) => ({ ...p, [k]: v }));

  const goToStep2 = () => {
    if (!s1.name.trim()) { setToast({ msg: 'Введите имя', type: 'error' }); return; }
    if (!s1.surname.trim()) { setToast({ msg: 'Введите фамилию', type: 'error' }); return; }
    if (!s1.position.trim()) { setToast({ msg: 'Укажите желаемую должность', type: 'error' }); return; }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const submit = async () => {
    setSaving(true);
    try {
      await candidateApi.saveResume({
        photoUrl: s1.photoUrl || null,
        name: s1.name.trim(),
        surname: s1.surname.trim(),
        phone: s1.phone.trim() || undefined,
        position: s1.position.trim(),
        age: s2.age ? Number(s2.age) : undefined,
        gender: s2.gender || undefined,
        location: s2.location.trim() || undefined,
        education: s2.education.trim() || undefined,
        skills: s2.skills.trim() || undefined,
        workPlace: s2.workPlace.trim() || undefined,
        aboutMe: s2.aboutMe.trim() || undefined,
        salary: s2.salary ? Number(s2.salary) : undefined,
      });
      nav('/app/vacancies', { replace: true });
    } catch {
      setToast({ msg: 'Ошибка сохранения, попробуйте ещё раз', type: 'error' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="font-bold text-xl text-[#2557a7]">job.kz</div>
          <button
            type="button"
            className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
            onClick={() => nav('/app/vacancies', { replace: true })}
          >
            Пропустить →
          </button>
        </div>
      </header>

      {/* Progress bar */}
      <div className="bg-white border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 flex-1">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
                style={{ backgroundColor: hhBlue }}
              >
                {step === 1 ? '1' : '✓'}
              </div>
              <span className={`text-sm font-medium ${step === 1 ? 'text-[#2557a7]' : 'text-slate-400'}`}>
                Основное
              </span>
            </div>
            <div className="h-px flex-1 bg-slate-200" />
            <div className="flex items-center gap-2 flex-1 justify-end">
              <span className={`text-sm font-medium ${step === 2 ? 'text-[#2557a7]' : 'text-slate-400'}`}>
                Подробности
              </span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                  step === 2 ? 'text-white' : 'text-slate-400 bg-slate-200'
                }`}
                style={step === 2 ? { backgroundColor: hhBlue } : {}}
              >
                2
              </div>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-8">
        {step === 1 ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Шаг 1 — Основная информация</h1>
              <p className="text-sm text-slate-500 mt-1">Заполните минимально необходимые данные, чтобы продолжить.</p>
            </div>

            {/* Photo */}
            <div className="flex flex-col items-center pt-2 pb-2">
              <PhotoPicker value={s1.photoUrl} onChange={(url) => f1('photoUrl', url)} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Имя *"
                placeholder="Алихан"
                value={s1.name}
                onChange={(e) => f1('name', e.target.value)}
              />
              <Input
                label="Фамилия *"
                placeholder="Сейткали"
                value={s1.surname}
                onChange={(e) => f1('surname', e.target.value)}
              />
              <PhoneInput
                label="Телефон"
                value={s1.phone}
                onChange={(v) => f1('phone', v)}
              />
              <Input
                label="Желаемая должность *"
                placeholder="Frontend-разработчик"
                value={s1.position}
                onChange={(e) => f1('position', e.target.value)}
              />
            </div>

            <div className="flex justify-end pt-2">
              <Btn
                variant="primary"
                className="!bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91] px-8"
                onClick={goToStep2}
              >
                Далее →
              </Btn>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
            <div>
              <h1 className="text-xl font-semibold text-slate-900">Шаг 2 — Подробный профиль</h1>
              <p className="text-sm text-slate-500 mt-1">Эти данные помогут работодателям найти вас. Можно заполнить позже.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Возраст"
                type="number"
                placeholder="25"
                value={s2.age}
                onChange={(e) => f2('age', e.target.value)}
              />
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Пол</label>
                <select
                  className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100 text-slate-800"
                  value={s2.gender}
                  onChange={(e) => f2('gender', e.target.value)}
                >
                  <option value="">Не указан</option>
                  {GENDER_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <Input
                label="Город"
                placeholder="Алматы"
                value={s2.location}
                onChange={(e) => f2('location', e.target.value)}
              />
              <Input
                label="Желаемая зарплата (₸)"
                type="number"
                placeholder="300000"
                value={s2.salary}
                onChange={(e) => f2('salary', e.target.value)}
              />
            </div>

            <Textarea
              label="Образование"
              placeholder="Университет, специальность, год окончания…"
              value={s2.education}
              onChange={(e) => f2('education', e.target.value)}
              rows={3}
            />
            <Textarea
              label="Навыки"
              placeholder="JavaScript, React, TypeScript, Git…"
              value={s2.skills}
              onChange={(e) => f2('skills', e.target.value)}
              rows={3}
            />
            <Textarea
              label="Опыт работы"
              placeholder="Название компании, должность, период и краткое описание…"
              value={s2.workPlace}
              onChange={(e) => f2('workPlace', e.target.value)}
              rows={4}
            />
            <Textarea
              label="О себе"
              placeholder="Расскажите о себе в свободной форме…"
              value={s2.aboutMe}
              onChange={(e) => f2('aboutMe', e.target.value)}
              rows={3}
            />

            <div className="flex items-center justify-between pt-2">
              <button
                type="button"
                className="text-sm text-slate-500 hover:text-slate-700 hover:underline"
                onClick={() => { setStep(1); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              >
                ← Назад
              </button>
              <Btn
                variant="primary"
                className="!bg-[#2557a7] !border-[#2557a7] hover:!bg-[#1f4a91] px-8"
                onClick={submit}
                disabled={saving}
              >
                {saving ? 'Сохранение…' : 'Сохранить и начать'}
              </Btn>
            </div>
          </div>
        )}
      </main>

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}

function Textarea({
  label,
  value,
  onChange,
  rows = 3,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  rows?: number;
  placeholder?: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">{label}</label>
      <textarea
        className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg outline-none focus:border-[#2557a7] focus:ring-2 focus:ring-blue-100 text-slate-800 placeholder-slate-400"
        rows={rows}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
      />
    </div>
  );
}
