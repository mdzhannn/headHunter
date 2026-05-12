import { useState, useEffect, useCallback } from 'react';
import { api } from '../api';
import type { User } from '../types';
import { Btn, Input, PhoneInput, Badge, Card, SectionHeader, Empty, Spinner, Modal, Toast } from '../components/ui';
import { getAdminSubRoleFromToken, getStoredToken } from '../candidate/auth';

export default function UsersPage() {
  const adminSubRole = getAdminSubRoleFromToken(getStoredToken());
  const canManageUsers = adminSubRole === 'SUPER_ADMIN';
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form, setForm] = useState({
    name: '',
    surname: '',
    email: '',
    phone: '+7',
    roleName: 'CANDIDATE' as 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN',
  });
  const [roleDrafts, setRoleDrafts] = useState<Record<number, 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN'>>({});

  const load = useCallback(async () => {
    setLoading(true);
    try { setUsers(await api.users.getAll() as User[]); }
    catch { setToast({ msg: 'Не удалось загрузить пользователей', type: 'error' }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const next: Record<number, 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN'> = {};
    users.forEach((u) => {
      next[u.id] = u.roleName ?? 'CANDIDATE';
    });
    setRoleDrafts(next);
  }, [users]);

  const notify = (msg: string, type: 'success' | 'error' = 'success') => setToast({ msg, type });

  const handleCreate = async () => {
    try {
      await api.users.create(form);
      notify('Пользователь создан');
      setShowCreate(false);
      setForm({ name: '', surname: '', email: '', phone: '+7', roleName: 'CANDIDATE' });
      load();
    } catch { notify('Ошибка создания', 'error'); }
  };

  const handleUpdate = async () => {
    if (!editUser) return;
    try {
      await api.users.update({ ...editUser, ...form });
      notify('Обновлено');
      setEditUser(null);
      load();
    } catch { notify('Ошибка обновления', 'error'); }
  };

  const handleDelete = async (id: number) => {
    try { await api.users.delete(id); notify('Удалён'); load(); }
    catch { notify('Ошибка удаления', 'error'); }
  };

  const handleBlock = async (user: User) => {
    try {
      if (user.isBlocked) { await api.users.unblock(user.id); notify('Разблокирован'); }
      else { await api.users.block(user.id); notify('Заблокирован'); }
      load();
    } catch { notify('Ошибка', 'error'); }
  };

  const handleAssignRole = async (user: User) => {
    const nextRole = roleDrafts[user.id] ?? 'CANDIDATE';
    try {
      await api.users.update({
        ...user,
        roleName: nextRole,
      });
      notify('Роль обновлена');
      load();
    } catch {
      notify('Ошибка назначения роли', 'error');
    }
  };

  return (
    <div>
      <SectionHeader
        title="Пользователи"
        subtitle={`${users.length} в системе`}
        action={canManageUsers ? <Btn variant="primary" onClick={() => setShowCreate(true)}>+ Добавить</Btn> : undefined}
      />

      {loading ? <Spinner /> : users.length === 0 ? <Empty label="Нет пользователей" /> : (
        <div className="grid gap-3">
          {users.map(u => (
            <Card key={u.id} className="flex items-center gap-4 px-5 py-4">
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-sm flex-shrink-0">
                {u.name?.[0]}{u.surname?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-slate-900 text-sm">{u.name} {u.surname}</span>
                  <Badge color="slate">#{u.id}</Badge>
                  <Badge color="indigo">{u.roleName ?? 'CANDIDATE'}</Badge>
                  {u.roleName === 'ADMIN' && u.adminRoleName && <Badge color="amber">{u.adminRoleName}</Badge>}
                  {u.isBlocked && <Badge color="red">Заблокирован</Badge>}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">{u.email} · {u.phone}</div>
              </div>
              {canManageUsers && (
                <div className="flex gap-2 flex-shrink-0">
                  <select
                    className="px-2 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-700"
                    value={roleDrafts[u.id] ?? (u.roleName ?? 'CANDIDATE')}
                    onChange={(e) =>
                      setRoleDrafts((prev) => ({
                        ...prev,
                        [u.id]: e.target.value as 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN',
                      }))
                    }
                  >
                    <option value="CANDIDATE">CANDIDATE</option>
                    <option value="EMPLOYER">EMPLOYER</option>
                    <option value="BOTH">BOTH</option>
                    <option value="ADMIN">ADMIN</option>
                  </select>
                  <Btn size="sm" variant="success" onClick={() => handleAssignRole(u)}>
                    Назначить
                  </Btn>
                  <Btn size="sm" onClick={() => { setEditUser(u); setForm({ name: u.name, surname: u.surname, email: u.email, phone: u.phone, roleName: u.roleName ?? 'CANDIDATE' }); }}>Изменить</Btn>
                  <Btn size="sm" variant={u.isBlocked ? 'success' : 'ghost'} onClick={() => handleBlock(u)}>
                    {u.isBlocked ? 'Разблок.' : 'Блок.'}
                  </Btn>
                  <Btn size="sm" variant="danger" onClick={() => handleDelete(u.id)}>Удалить</Btn>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}

      {showCreate && canManageUsers && (
        <Modal title="Новый пользователь" onClose={() => setShowCreate(false)}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Иван" />
            <Input label="Фамилия" value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} placeholder="Иванов" />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ivan@mail.com" />
            <PhoneInput label="Телефон" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Роль</label>
              <select
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800"
                value={form.roleName}
                onChange={e => setForm(f => ({ ...f, roleName: e.target.value as 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN' }))}
              >
                <option value="CANDIDATE">CANDIDATE (соискатель)</option>
                <option value="EMPLOYER">EMPLOYER (компания)</option>
                <option value="BOTH">BOTH (оба режима)</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setShowCreate(false)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleCreate}>Создать</Btn>
          </div>
        </Modal>
      )}

      {editUser && canManageUsers && (
        <Modal title="Редактировать пользователя" onClose={() => setEditUser(null)}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Имя" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            <Input label="Фамилия" value={form.surname} onChange={e => setForm(f => ({ ...f, surname: e.target.value }))} />
            <Input label="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            <PhoneInput label="Телефон" value={form.phone} onChange={v => setForm(f => ({ ...f, phone: v }))} />
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Роль</label>
              <select
                className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800"
                value={form.roleName}
                onChange={e => setForm(f => ({ ...f, roleName: e.target.value as 'CANDIDATE' | 'EMPLOYER' | 'BOTH' | 'ADMIN' }))}
              >
                <option value="CANDIDATE">CANDIDATE (соискатель)</option>
                <option value="EMPLOYER">EMPLOYER (компания)</option>
                <option value="BOTH">BOTH (оба режима)</option>
                <option value="ADMIN">ADMIN</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-5">
            <Btn onClick={() => setEditUser(null)}>Отмена</Btn>
            <Btn variant="primary" onClick={handleUpdate}>Сохранить</Btn>
          </div>
        </Modal>
      )}

      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
