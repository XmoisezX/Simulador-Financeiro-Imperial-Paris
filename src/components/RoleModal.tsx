import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, Trash2 } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { supabase } from '../integrations/supabase/client';

export interface Role {
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

  useEffect(() => {
    if (isOpen) {
      setNome(role?.nome ?? '');
      setDescricao(role?.descricao ?? '');
      setError(null);
    }
  }, [isOpen, role]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!nome.trim()) {
      setError('O nome do papel é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError(null);

    try {
      if (role && role.id) {
        const { error } = await supabase
          .from('roles')
          .update({ nome: nome.trim(), descricao: descricao.trim() || null })
          .eq('id', role.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('roles')
          .insert({ nome: nome.trim(), descricao: descricao.trim() || null });
        if (error) throw error;
      }
      onSaved();
      onClose();
    } catch (e: any) {
      console.error('Erro salvando role:', e);
      setError(e?.message || 'Erro ao salvar papel.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!role || !role.id) return;
    if (!confirm(`Confirma exclusão do papel "${role.nome}"? Esta ação pode falhar se houver dependências.`)) return;

    setIsDeleting(true);
    setError(null);

    try {
      const { error } = await supabase
        .from('roles')
        .delete()
        .eq('id', role.id);
      if (error) throw error;

      // Também tentar remover quaisquer user_roles relacionados (melhor limpar)
      await supabase.from('user_roles').delete().eq('role_id', role.id);

      onSaved();
      onClose();
    } catch (e: any) {
      console.error('Erro ao excluir papel:', e);
      setError(e?.message || 'Erro ao excluir papel. Verifique dependências (user_roles).');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark-text">{role ? 'Editar Grupo' : 'Novo Grupo'}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>}

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
              rows={4}
              className="w-full p-2 border border-gray-300 rounded-md text-sm text-light-text"
              placeholder="Pequena descrição do papel"
            />
          </div>
        </div>

        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <div>
            {role && (
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center px-3 py-2 rounded-md text-red-600 border border-red-200 hover:bg-red-50"
              >
                {isDeleting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Trash2 className="w-4 h-4 mr-2" />}
                Excluir Grupo
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Button variant="outline" onClick={onClose} disabled={isSaving || isDeleting}>Cancelar</Button>
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