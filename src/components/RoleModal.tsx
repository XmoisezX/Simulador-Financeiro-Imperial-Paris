import React, { useEffect, useMemo, useState, useCallback } from 'react';
import { X, Save, Loader2, Trash2, Shield, Search } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { supabase } from '../integrations/supabase/client';
import { Checkbox } from './ui/Checkbox';

export interface Role {
  id: number;
  nome: string;
  descricao: string | null;
}

interface Permission {
  id: number;
  nome: string;
  descricao: string | null;
}

interface RoleModalProps {
  isOpen: boolean;
  role?: Role | null; // se fornecido, é edição; se não, é criação
  onClose: () => void;
  onSaved: () => void;
}

const RoleModal: React.FC<RoleModalProps> = ({ isOpen, role, onClose, onSaved }) => {
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Permissões
  const [allPermissions, setAllPermissions] = useState<Permission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(false);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>([]);
  const [initialPermissionIds, setInitialPermissionIds] = useState<number[]>([]);
  const [permSearch, setPermSearch] = useState('');

  // Carrega dados iniciais ao abrir
  useEffect(() => {
    if (isOpen) {
      setNome(role?.nome ?? '');
      setDescricao(role?.descricao ?? '');
      setError(null);
      setPermSearch('');

      if (role?.id) {
        // carregar permissões e as associadas ao papel
        const load = async () => {
          setLoadingPerms(true);
          try {
            const [{ data: perms, error: permsErr }, { data: rolePerms, error: rpErr }] = await Promise.all([
              supabase.from('permissions').select('id, nome, descricao').order('nome', { ascending: true }),
              supabase.from('role_permissions').select('permission_id').eq('role_id', role.id),
            ]);

            if (permsErr) throw permsErr;
            setAllPermissions((perms || []) as Permission[]);

            if (rpErr) throw rpErr;
            const ids = (rolePerms || []).map((rp: any) => rp.permission_id as number);
            setSelectedPermissionIds(ids);
            setInitialPermissionIds(ids);
          } catch (e: any) {
            console.error('Erro ao carregar permissões:', e);
            setError(e?.message || 'Falha ao carregar permissões.');
            setAllPermissions([]);
            setSelectedPermissionIds([]);
            setInitialPermissionIds([]);
          } finally {
            setLoadingPerms(false);
          }
        };
        load();
      } else {
        // novo papel: carrega todas as permissões, nenhuma selecionada
        const loadAll = async () => {
          setLoadingPerms(true);
          try {
            const { data: perms, error: permsErr } = await supabase.from('permissions').select('id, nome, descricao').order('nome', { ascending: true });
            if (permsErr) throw permsErr;
            setAllPermissions((perms || []) as Permission[]);
            setSelectedPermissionIds([]);
            setInitialPermissionIds([]);
          } catch (e: any) {
            console.error('Erro ao carregar permissões:', e);
            setError(e?.message || 'Falha ao carregar permissões.');
            setAllPermissions([]);
          } finally {
            setLoadingPerms(false);
          }
        };
        loadAll();
      }
    }
  }, [isOpen, role]);

  const filteredPermissions = useMemo(() => {
    const q = permSearch.trim().toLowerCase();
    if (!q) return allPermissions;
    return allPermissions.filter(p => `${p.nome} ${p.descricao || ''}`.toLowerCase().includes(q));
  }, [permSearch, allPermissions]);

  const togglePermission = useCallback((id: number, checked: boolean) => {
    setSelectedPermissionIds(prev => {
      const has = prev.includes(id);
      if (checked && !has) return [...prev, id];
      if (!checked && has) return prev.filter(pid => pid !== id);
      return prev;
    });
  }, []);

  const handleSave = async () => {
    if (!nome.trim()) {
      setError('O nome do grupo é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      let currentRoleId = role?.id ?? null;

      // 1) Salva/atualiza o papel
      if (currentRoleId) {
        const { error: updErr } = await supabase
          .from('roles')
          .update({ nome: nome.trim(), descricao: descricao.trim() || null })
          .eq('id', currentRoleId);
        if (updErr) throw updErr;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('roles')
          .insert({ nome: nome.trim(), descricao: descricao.trim() || null })
          .select('id')
          .single();
        if (insErr) throw insErr;
        currentRoleId = inserted?.id as number;
      }

      // 2) Sincroniza permissões (apenas se já tivermos o id do papel)
      if (currentRoleId) {
        const toAdd = selectedPermissionIds.filter(id => !initialPermissionIds.includes(id));
        const toRemove = initialPermissionIds.filter(id => !selectedPermissionIds.includes(id));

        if (toAdd.length > 0) {
          const rows = toAdd.map(pid => ({ role_id: currentRoleId, permission_id: pid }));
          const { error: addErr } = await supabase.from('role_permissions').insert(rows);
          if (addErr) throw addErr;
        }

        if (toRemove.length > 0) {
          // Deleta em lote combinando role_id + permission_id
          const { error: delErr } = await supabase
            .from('role_permissions')
            .delete()
            .in('permission_id', toRemove)
            .eq('role_id', currentRoleId);
          if (delErr) throw delErr;
        }
      }

      onSaved();
      onClose();
    } catch (e: any) {
      console.error('Erro salvando grupo/permissões:', e);
      setError(e?.message || 'Erro ao salvar o grupo.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!role || !role.id) return;
    if (!confirm(`Confirma exclusão do grupo "${role.nome}"? Esta ação pode falhar se houver dependências.`)) return;

    setIsDeleting(true);
    setError(null);

    try {
      // Remove associações primeiro (melhor experiência)
      await supabase.from('role_permissions').delete().eq('role_id', role.id);
      await supabase.from('user_roles').delete().eq('role_id', role.id);

      const { error: delErr } = await supabase.from('roles').delete().eq('id', role.id);
      if (delErr) throw delErr;

      onSaved();
      onClose();
    } catch (e: any) {
      console.error('Erro ao excluir grupo:', e);
      setError(e?.message || 'Erro ao excluir grupo. Verifique dependências.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark-text flex items-center">
            <Shield className="w-5 h-5 mr-2 text-blue-600" /> {role ? 'Editar Grupo' : 'Novo Grupo'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <TextInput
              id="roleNome"
              label="Nome do Grupo"
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              placeholder="Ex: Admin, Assistente"
            />
            <div>
              <label className="block text-sm font-medium text-light-text mb-1">Descrição (opcional)</label>
              <textarea
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                rows={2}
                className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
                placeholder="Pequena descrição do grupo"
              />
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-md font-semibold text-dark-text">Permissões do grupo</h3>
              <div className="relative">
                <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
                <input
                  type="text"
                  placeholder="Buscar permissões..."
                  value={permSearch}
                  onChange={(e) => setPermSearch(e.target.value)}
                  className="pl-7 pr-3 py-2 border rounded-md text-sm w-64"
                />
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-md border">
              {loadingPerms ? (
                <div className="flex items-center text-gray-600">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Carregando permissões...
                </div>
              ) : filteredPermissions.length === 0 ? (
                <p className="text-sm text-gray-500">Nenhuma permissão encontrada.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {filteredPermissions.map((perm) => {
                    const checked = selectedPermissionIds.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        className={`flex items-center justify-between p-2 rounded-md border transition ${
                          checked ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-200 hover:bg-gray-50'
                        }`}
                        title={perm.descricao || perm.nome}
                      >
                        <div className="pr-2">
                          <p className="text-sm font-medium text-dark-text truncate">{perm.nome}</p>
                          {perm.descricao && <p className="text-xs text-gray-500 truncate">{perm.descricao}</p>}
                        </div>
                        <Checkbox
                          id={`perm-${perm.id}`}
                          checked={checked}
                          onCheckedChange={(c) => togglePermission(perm.id, Boolean(c))}
                          className="w-5 h-5"
                        />
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <div>
            {role && role.id ? (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-3 py-2 rounded-md text-red-600 border border-red-200 hover:bg-red-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Excluir Grupo
              </button>
            ) : null}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={isSaving || isDeleting}>
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleModal;