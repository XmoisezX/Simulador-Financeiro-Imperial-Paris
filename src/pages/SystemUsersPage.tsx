import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Users, RefreshCw, Shield, Mail, User as UserIcon, Loader2, Lock, AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import TextInput from '../components/TextInput';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  role: string | null;
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
  const [userRoles, setUserRoles] = useState<Record<string, number[]>>({});
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Filtros
  const [q, setQ] = useState('');
  const [roleFilterId, setRoleFilterId] = useState<number | ''>('');

  const fetchPermission = useCallback(async () => {
    const { data, error } = await supabase.rpc('has_permission', { p_permission: 'gerenciar_usuarios' });
    if (error) {
      console.error('Erro ao checar permissão:', error);
      setCanManage(false);
    } else {
      setCanManage(Boolean(data));
    }
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    // roles
    const rolesRes = await supabase.from('roles').select('id,nome,descricao').order('nome', { ascending: true });
    if (rolesRes.error) {
      setError('Erro ao carregar papéis.');
      setLoading(false);
      return;
    }

    // profiles
    const profilesRes = await supabase.from('profiles').select('id, full_name, email, role, updated_at').order('full_name', { ascending: true });
    if (profilesRes.error) {
      setError('Erro ao carregar perfis.');
      setLoading(false);
      return;
    }

    // user_roles
    const userRolesRes = await supabase.from('user_roles').select('user_id, role_id');
    if (userRolesRes.error) {
      setError('Erro ao carregar vínculos de papéis.');
      setLoading(false);
      return;
    }

    const map: Record<string, number[]> = {};
    (userRolesRes.data || []).forEach((ur: any) => {
      if (!map[ur.user_id]) map[ur.user_id] = [];
      map[ur.user_id].push(ur.role_id);
    });

    setRoles(rolesRes.data as Role[]);
    setProfiles(profilesRes.data as Profile[]);
    setUserRoles(map);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (session) {
      fetchPermission();
      fetchData();
    }
  }, [session, fetchData, fetchPermission]);

  const filtered = useMemo(() => {
    return profiles.filter(p => {
      const nameEmail = `${p.full_name || ''} ${p.email || ''}`.toLowerCase();
      if (q && !nameEmail.includes(q.toLowerCase())) return false;
      if (roleFilterId) {
        const assigned = userRoles[p.id] || [];
        if (!assigned.includes(roleFilterId as number)) return false;
      }
      return true;
    });
  }, [profiles, q, roleFilterId, userRoles]);

  const handleRolesChange = async (userId: string, roleId: number, checked: boolean) => {
    setBusyId(userId);
    if (checked) {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role_id: roleId });
      if (error) {
        alert(`Erro ao adicionar papel: ${error.message}`);
      } else {
        setUserRoles(prev => ({ ...prev, [userId]: [...(prev[userId] || []), roleId] }));
      }
    } else {
      const { error } = await supabase.from('user_roles').delete().match({ user_id: userId, role_id: roleId });
      if (error) {
        alert(`Erro ao remover papel: ${error.message}`);
      } else {
        setUserRoles(prev => ({ ...prev, [userId]: (prev[userId] || []).filter(id => id !== roleId) }));
      }
    }
    setBusyId(null);
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
            <p className="text-sm text-yellow-700">Você não possui permissão para gerenciar usuários e papéis. Contate um administrador.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-dark-text flex items-center">
          <Shield className="w-6 h-6 mr-2 text-blue-600" /> Usuários e Permissões
        </h1>
        <div className="flex gap-3">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-light-text">Filtrar por Papel</label>
            <select value={roleFilterId} onChange={(e) => setRoleFilterId(e.target.value ? Number(e.target.value) : '')} className="p-2 border rounded-md text-sm bg-white">
              <option value="">Todos</option>
              {roles.map(r => (
                <option key={r.id} value={r.id}>{r.nome}</option>
              ))}
            </select>
          </div>
          <Button
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </div>

      <Card className="shadow-md mb-6">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <TextInput id="search" label="Nome ou E-mail" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar..." />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="p-4 bg-red-100 border border-red-200 rounded-md text-red-700 mb-4 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" /> {error}
        </div>
      )}

      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Usuário</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">E-mail</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Papéis</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
                      Carregando usuários...
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="text-center py-10 text-gray-500">
                      Nenhum usuário encontrado.
                    </td>
                  </tr>
                ) : (
                  filtered.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text flex items-center gap-2">
                        <UserIcon className="w-4 h-4 text-gray-400" /> {p.full_name || '(Sem nome)'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text flex items-center gap-2">
                        <Mail className="w-4 h-4 text-gray-400" /> {p.email || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex flex-wrap gap-2">
                          {roles.map(r => {
                            const checked = (userRoles[p.id] || []).includes(r.id);
                            return (
                              <label key={r.id} className="flex items-center gap-1 text-xs border px-2 py-1 rounded-md">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={busyId === p.id}
                                  onChange={(e) => handleRolesChange(p.id, r.id, e.target.checked)}
                                />
                                {r.nome}
                              </label>
                            );
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => handleResetPassword(p)}
                            disabled={busyId === p.id}
                            title="Redefinir senha via e-mail"
                          >
                            Redefinir Senha
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
    </div>
  );
};

export default SystemUsersPage;