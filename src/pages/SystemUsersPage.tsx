import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Users,
  RefreshCw,
  Shield,
  Mail,
  User as UserIcon,
  Loader2,
  AlertTriangle,
  UserPlus,
  XCircle,
  Lock,
  Edit,
  Plus
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import TextInput from '../components/TextInput';
import { useAuth } from '../contexts/AuthContext';
import NewUserModal from '../components/NewUserModal';
import RoleModal from '../components/RoleModal';

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
  const { session, supabase } = useAuth();

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

  // Role modal state
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);

  const fetchPermission = useCallback(async () => {
    const { data, error } = await supabase.rpc('has_permission', { p_permission: 'gerenciar_usuarios' });
    if (error) {
      console.error('Erro ao checar permissão:', error);
      setCanManage(false);
    } else {
      setCanManage(Boolean(data));
    }
  }, [supabase]);

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

      setRoles((rolesRes.data || []) as Role[]);
      setProfiles((profilesRes.data || []) as Profile[]);
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
  }, [supabase]);

  useEffect(() => {
    if (session) {
      fetchPermission();
      fetchAll();
    }
  }, [session, fetchAll, fetchPermission]);

  const filteredProfiles = useMemo(() => {
    return profiles.filter((p) => {
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
    roles.forEach((r) => (counts[r.id] = 0));
    Object.values(userRolesMap).forEach((roleIds) => {
      roleIds.forEach((rid) => {
        if (counts[rid] === undefined) counts[rid] = 0;
        counts[rid] += 1;
      });
    });
    return counts;
  }, [roles, userRolesMap]);

  const handleRolesChange = async (userId: string, roleId: number, checked: boolean) => {
    if (!canManage) {
      alert('Você não tem permissão para gerenciar grupos.');
      return;
    }

    const profile = profiles.find((p) => p.id === userId);
    if (!profile) {
      alert('Perfil não encontrado.');
      return;
    }

    if (!profile.email && checked) {
      alert('Este perfil não possui e-mail cadastrado. Crie o usuário primeiro para atribuir papéis.');
      return;
    }

    setBusyId(userId);
    try {
      const action = checked ? 'add' : 'remove';
      const { error: rpcError } = await supabase.rpc('manage_user_role', {
        p_profile_id: userId,
        p_role_id: roleId,
        p_action: action,
      });

      if (rpcError) {
        console.error('Erro ao atualizar papel:', rpcError);
        alert(`Erro ao atualizar papel: ${rpcError.message}`);
        throw rpcError;
      }

      setUserRolesMap((prev) => {
        const current = prev[userId] || [];
        if (action === 'add') {
          if (current.includes(roleId)) return prev;
          return { ...prev, [userId]: [...current, roleId] };
        }
        return { ...prev, [userId]: current.filter((id) => id !== roleId) };
      });

      await fetchAll();
    } catch (err) {
      console.error(err);
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

  const openEditRole = (r: Role) => {
    setEditingRole(r);
    setIsRoleModalOpen(true);
  };

  const openNewRole = () => {
    setEditingRole(null);
    setIsRoleModalOpen(true);
  };

  // NEW: helper to assign Moisez da Silva Torres as admin
  const handleMakeMoisezAdmin = async () => {
    if (!canManage) {
      alert('Você precisa de permissão para gerenciar usuários.');
      return;
    }

    if (!confirm('Deseja tornar "Moisez da Silva Torres" administrador?')) return;

    try {
      // 1) Buscar perfil pelo nome (case-insensitive)
      const { data: profs, error: profErr } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .ilike('full_name', '%moisez%');

      if (profErr) {
        throw profErr;
      }
      if (!profs || profs.length === 0) {
        alert('Perfil "Moisez" não encontrado. Verifique se existe um profile com esse nome.');
        return;
      }

      // Tenta achar o exato "Moisez da Silva Torres" primeiro
      let target = profs.find((p: any) => (p.full_name || '').toLowerCase().includes('moisez da silva torres'));
      if (!target) {
        // fallback: pega o primeiro que contenha 'moisez'
        target = profs[0];
      }

      // 2) Buscar role 'Administrativo' ou 'Admin'
      const { data: rolesFound, error: rolesErr } = await supabase
        .from('roles')
        .select('id, nome')
        .ilike('nome', '%admin%');

      if (rolesErr) throw rolesErr;
      if (!rolesFound || rolesFound.length === 0) {
        alert('Nenhum papel com nome contendo "admin" encontrado. Crie um papel "Administrativo" antes.');
        return;
      }

      // Prefer 'Administrativo' if present
      let adminRole = rolesFound.find((r: any) => (r.nome || '').toLowerCase().includes('administrat'));
      if (!adminRole) adminRole = rolesFound[0];

      // 3) Chamar RPC manage_user_role para adicionar
      const { error: manageErr } = await supabase.rpc('manage_user_role', {
        p_profile_id: target.id,
        p_role_id: adminRole.id,
        p_action: 'add',
      });

      if (manageErr) {
        console.error('manage_user_role error:', manageErr);
        alert(`Falha ao atribuir papel: ${manageErr.message}`);
        return;
      }

      alert(`Usuário ${target.full_name} atualizado para o papel ${adminRole.nome}.`);
      // Refresh UI
      await fetchAll();
    } catch (e: any) {
      console.error(e);
      alert(`Erro ao tentar atribuir admin: ${e?.message || e}`);
    }
  };

  const UsersTab = (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">E-mail</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider min-w-[300px]">Grupos</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
              ) : filteredProfiles.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-10 text-gray-500">
                    Nenhum usuário encontrado.
                  </td>
                </tr>
              ) : (
                filteredProfiles.map((p) => {
                  const assignedRoles = userRolesMap[p.id] || [];
                  const isBusy = busyId === p.id;

                  return (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {p.avatar_url ? (
                              <img src={p.avatar_url} alt={p.full_name || 'Usuário'} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-5 h-5 text-gray-500" />
                            )}
                          </div>
                          <span>{p.full_name || '—'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {p.email || '—'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                        <div className="flex flex-wrap gap-3">
                          {roles.map((r) => {
                            const checked = assignedRoles.includes(r.id);
                            return (
                              <label key={`${p.id}-${r.id}`} className="flex items-center gap-2 text-xs border px-2 py-1 rounded-md">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={isBusy || !canManage}
                                  onChange={(e) => handleRolesChange(p.id, r.id, e.target.checked)}
                                />
                                {r.nome}
                              </label>
                            );
                          })}
                          {roles.length === 0 && <span className="text-xs text-gray-500">Nenhum grupo cadastrado.</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-600 hover:bg-blue-50"
                            onClick={() => handleResetPassword(p)}
                            disabled={!p.email}
                            title="Redefinir senha"
                          >
                            <Lock className="w-4 h-4 mr-1" /> Resetar senha
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
  );

  const GroupsTab = (
    <Card className="shadow-lg">
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuários</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
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
                roles.map((r) => {
                  const count = roleCounts[r.id] || 0;
                  return (
                    <tr key={r.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-dark-text">
                        {r.nome}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">
                        {r.descricao || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-dark-text">
                        {count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-blue-600 hover:bg-blue-50"
                          onClick={() => openEditRole(r)}
                          disabled={!canManage}
                        >
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
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
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
      {!canManage && (
        <div className="mb-4 p-3 bg-amber-100 border border-amber-200 text-amber-800 rounded-md flex items-start gap-2">
          <XCircle className="w-5 h-5 mt-0.5" />
          <p className="text-sm">
            Você pode visualizar a lista de usuários, mas não possui permissão para alterar papéis.
            Solicite a um administrador para liberar o acesso.
          </p>
        </div>
      )}

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

          <Button
            className="bg-blue-600 hover:bg-blue-700 text-white"
            onClick={() => setIsNewOpen(true)}
            disabled={!canManage}
          >
            <UserPlus className="w-4 h-4 mr-2" /> Novo usuário
          </Button>

          <Button
            variant="outline"
            className="text-blue-600 border-blue-600 hover:bg-blue-50"
            onClick={fetchAll}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Atualizar
          </Button>

          {/* NEW: Quick action to make Moisez admin */}
          <Button
            className="bg-primary-orange hover:bg-secondary-orange text-white"
            onClick={handleMakeMoisezAdmin}
            disabled={!canManage}
            title="Tornar Moisez Administrador"
          >
            <UserPlus className="w-4 h-4 mr-2" /> Tornar Moisez Admin
          </Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="flex items-center gap-2 border-b">
          <button
            className={`py-2 px-3 text-sm font-semibold ${
              tab === 'users' ? 'border-b-2 border-blue-600 text-blue-800' : 'text-slate-600'
            }`}
            onClick={() => setTab('users')}
          >
            Usuários
          </button>
          <button
            className={`py-2 px-3 text-sm font-semibold ${
              tab === 'groups' ? 'border-b-2 border-blue-600 text-blue-800' : 'text-slate-600'
            }`}
            onClick={() => setTab('groups')}
          >
            Grupos
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-400 text-red-700 rounded-md mb-6 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2" /> {error}
        </div>
      )}

      <div className="space-y-6">
        {tab === 'users' ? UsersTab : GroupsTab}

        {tab === 'groups' && (
          <div className="flex justify-end">
            <Button
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={openNewRole}
              disabled={!canManage}
            >
              <Plus className="w-4 h-4 mr-2" /> Novo Grupo
            </Button>
          </div>
        )}
      </div>

      <NewUserModal
        isOpen={isNewOpen}
        onClose={() => setIsNewOpen(false)}
        roles={roles}
        onCreated={fetchAll}
      />

      <RoleModal
        isOpen={isRoleModalOpen}
        role={editingRole}
        onClose={() => setIsRoleModalOpen(false)}
        onSaved={fetchAll}
      />
    </div>
  );
};

export default SystemUsersPage;