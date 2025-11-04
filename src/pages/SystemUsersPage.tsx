import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, Shield, Mail, User as UserIcon, Loader2, Lock, AlertTriangle, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import TextInput from '../components/TextInput';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import NewUserModal from '../components/NewUserModal';
import { invokeEdgeFunction } from '../utils/edgeFunctions';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url?: string | null;
  role?: string | null;
  updated_at: string | null;
}

interface Role {
  id: number;
  nome: string;
  descricao: string | null;
}

const SystemUsersPage: React.FC = () => {
  const { session } = useAuth();
  const [canManage, setCanManage] = useState<boolean>(false);

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRolesMap, setUserRolesMap] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [q, setQ] = useState('');
  const [roleFilterId, setRoleFilterId] = useState<number | ''>('');
  const [tab, setTab] = useState<'users' | 'groups'>('users');
  const [isNewOpen, setIsNewOpen] = useState(false);

  const fetchPermission = useCallback(async () => {
    const { data, error } = await supabase.rpc('has_permission', { p_permission: 'gerenciar_usuarios' });
    if (error) {
      console.error('Erro ao checar permissão:', error);
      setCanManage(false);
    } else {
      setCanManage(Boolean(data));
    }
  }, []);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [rolesRes, profilesRes, userRolesRes] = await Promise.all([
        supabase.from('roles').select('id,nome,descricao').order('nome', { ascending: true }),
        supabase.from('profiles').select('id, full_name, email, avatar_url, role, updated_at').order('full_name', { ascending: true }),
        supabase.from('user_roles').select('user_id, role_id'),
      ]);

      if (rolesRes.error) throw rolesRes.error;
      if (profilesRes.error) throw profilesRes.error;
      if (userRolesRes.error) throw userRolesRes.error;

      const map: Record<string, number[]> = {};
      (userRolesRes.data || []).forEach((ur: any) => {
        if (!map[ur.user_id]) map[ur.user_id] = [];
        map[ur.user_id].push(ur.role_id);
      });

      setRoles(rolesRes.data as Role[]);
      setProfiles(profilesRes.data as Profile[]);
      setUserRolesMap(map);
    } catch (e: any) {
      console.error('Erro ao carregar dados:', e);
      setError(e.message || 'Erro desconhecido ao carregar dados.');
      setRoles([]);
      setProfiles([]);
      setUserRolesMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (session) {
      fetchPermission();
      fetchAll();
    }
  }, [session, fetchAll, fetchPermission]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter(p => {
      const nameEmail = `${p.full_name || ''} ${p.email || ''}`.toLowerCase();
      if (q && !nameEmail.includes(q.toLowerCase())) return false;
      if (roleFilterId) {
        const assigned = userRolesMap[p.id] || [];
        if (!assigned.includes(roleFilterId as number)) return false;
      }
      return true;
    });
  }, [profiles, q, roleFilterId, userRolesMap]);

  const roleCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    roles.forEach(r => (counts[r.id] = 0));
    Object.values(userRolesMap).forEach(roleIds => {
      roleIds.forEach(rid => {
        if (counts[rid] === undefined) counts[rid] = 0;
        counts[rid] += 1;
      });
    });
    return counts;
  }, [roles, userRolesMap]);

  const handleRolesChange = async (userId: string, roleId: number, checked: boolean) => {
    setBusyId(userId);
    try {
      const profile = profiles.find(p => p.id === userId);
      if (!profile) throw new Error('Perfil não encontrado.');
      if (!profile.email && checked) {
        alert('Este perfil não possui e-mail registrado. Adicione um e-mail antes de convidar/criar a conta.');
        setBusyId(null);
        return;
      }

      const action = checked ? 'add' : 'remove';
      const token = session?.access_token;
      if (!token) {
        throw new Error('Sessão inválida. Faça login novamente.');
      }

      console.log('[assign-role] Request', { userId, roleId, action });

      const { data, error: funcErr, status } = await invokeEdgeFunction(
        'assign-role',
        { profile_id: userId, role_id: roleId, action },
        token
      );

      if (funcErr) {
        console.error('[assign-role] Edge function error', funcErr, 'status:', status);
        alert(`Erro ao atualizar papel: ${funcErr.message}`);
        throw funcErr;
      }

      console.log('[assign-role] Success response', data);

      setUserRolesMap(prev => {
        const current = prev[userId] || [];
        if (action === 'add') {
          if (!current.includes(roleId)) {
            return { ...prev, [userId]: [...current, roleId] };
          }
          return prev;
        }
        return { ...prev, [userId]: current.filter(id => id !== roleId) };
      });

      await fetchAll();

      alert((data as any)?.message || (action === 'add' ? 'Papel atribuído com sucesso.' : 'Papel removido com sucesso.'));
    } catch (e: any) {
      console.error('[assign-role] Failure', e);
      await fetchAll();
    } finally {
      setBusyId(null);
    }
  };

  const handleResetPassword = async (p: Profile) => {
    if (!p.email) {
      alert('Perfil sem e-mail.');
      return;
    }
    const redirectTo = `${window.location.origin}/login`;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(p.email, { redirectTo });
      if (error) throw error;
      alert(`E-mail de redefinição enviado para ${p.email}.`);
    } catch (e: any) {
      alert(`Falha ao disparar redefinição: ${e.message || e}`);
    }
  };

  if (!canManage) {
    return (
      <div className="p-6">
        <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
          <Lock className="w-6 h-6 text-yellow-700 mt-1" />
          <div>
            <h2 className="text-lg font-semibold text-yellow-800">Acesso restrito</h2>
            <p className="text-sm text-yellow-700">
              Você não possui permissão para gerenciar usuários e papéis. Contate um administrador.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-dark-text flex items-center gap-3">
            <Shield className="w-7 h-7 text-blue-600" /> Usuários e Grupos de Permissão
          </h1>
          <p className="text-sm text-gray-500 mt-1">Lista de usuários (profiles) e grupos (roles) do sistema.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <TextInput
              id="search"
              label=""
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Pesquise por nome ou e-mail"
            />
            <select
              value={roleFilterId}
              onChange={(e) => setRoleFilterId(e.target.value ? Number(e.target.value) : '')}
              className="p-2 border rounded text-sm bg-white"
            >
              <option value="">Todos os grupos</option>
              {roles.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.nome}
                </option>
              ))}
            </select>
          </div>

          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={() => setIsNewOpen(true)}>
            <UserPlus className="w-4 h-4 mr-2" /> Novo usuário
          </Button>
          <Button variant="outline" className="text-blue-600 border-blue-600 hover:bg-blue-50" onClick={fetchAll} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 bg-white rounded-t-md border-b border-gray-200">
        <div className="flex space-x-6 px-4">
          <button
            onClick={() => setTab('users')}
            className={`py-3 ${tab === 'users' ? 'border-b-2 border-primary-orange text-primary-orange font-semibold' : 'text-slate-600'}`}
          >
            Usuários ({profiles.length})
          </button>
          <button
            onClick={() => setTab('groups')}
            className={`py-3 ${tab === 'groups' ? 'border-b-2 border-primary-orange text-primary-orange font-semibold' : 'text-slate-600'}`}
          >
            Grupos de permissão ({roles.length})
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      {tab === 'users' && (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do usuário</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grupos</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Último acesso</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                        Carregando usuários...
                      </td>
                    </tr>
                  ) : filteredProfiles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-500">
                        Nenhum usuário encontrado.
                      </td>
                    </tr>
                  ) : (
                    filteredProfiles.map((p) => {
                      const assigned = userRolesMap[p.id] || [];
                      return (
                        <tr key={p.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm flex items-center gap-3">
                            <img
                              src={p.avatar_url || '/LOGO LARANJA.png'}
                              alt={p.full_name || 'Avatar'}
                              className="w-10 h-10 rounded-full object-cover border"
                            />
                            <div>
                              <div className="font-medium text-dark-text">{p.full_name || '—'}</div>
                              <div className="text-xs text-gray-500">{p.role || 'Sem registro'}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{p.email || '—'}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            <div className="flex flex-wrap gap-2">
                              {roles.map((r) => {
                                const checked = assigned.includes(r.id);
                                const disabled = busyId === p.id;
                                return (
                                  <label
                                    key={r.id}
                                    className={`flex items-center gap-1 text-xs border px-2 py-1 rounded-md ${
                                      checked ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      disabled={disabled}
                                      onChange={(e) => handleRolesChange(p.id, r.id, e.target.checked)}
                                    />
                                    <span>{r.nome}</span>
                                  </label>
                                );
                              })}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                            {p.updated_at ? new Date(p.updated_at).toLocaleString('pt-BR') : '—'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <div className="flex justify-end gap-2">
                              <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => handleResetPassword(p)}>
                                Redefinir Senha
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {tab === 'groups' && (
        <Card className="shadow-lg">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome do grupo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total usuários</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo de config.</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                        Carregando grupos...
                      </td>
                    </tr>
                  ) : roles.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="text-center py-10 text-gray-500">
                        Nenhum grupo cadastrado.
                      </td>
                    </tr>
                  ) : (
                    roles.map((r) => (
                      <tr key={r.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">{r.nome}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{roleCounts[r.id] ?? 0}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">Personalizado</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                          <div className="flex justify-end gap-2">
                            <Button variant="outline" size="sm" className="text-blue-600 hover:bg-blue-50" onClick={() => alert('Editar grupo (mock)')}>
                              Editar
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      <NewUserModal isOpen={isNewOpen} onClose={() => setIsNewOpen(false)} roles={roles} onCreated={fetchAll} />
    </div>
  );
};

export default SystemUsersPage;