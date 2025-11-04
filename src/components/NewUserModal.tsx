import React, { useEffect, useMemo, useState } from 'react';
import { X, Save, Loader2, UserPlus, Mail, Shield } from 'lucide-react';
import { Button } from './ui/Button';
import TextInput from './TextInput';
import { useAuth } from '../contexts/AuthContext';
import { invokeEdgeFunction } from '../utils/edgeFunctions';

interface Role {
  id: number;
  nome: string;
  descricao: string | null;
}

interface NewUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  roles: Role[];
  onCreated: () => void;
}

const NewUserModal: React.FC<NewUserModalProps> = ({ isOpen, onClose, roles, onCreated }) => {
  const { session } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedRoleIds, setSelectedRoleIds] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setFullName('');
      setEmail('');
      setSelectedRoleIds([]);
      setError(null);
      setIsSaving(false);
    }
  }, [isOpen]);

  const roleNamesForPayload = useMemo(() => {
    const map = new Map<number, string>();
    roles.forEach(r => map.set(r.id, r.nome));
    return selectedRoleIds.map(id => map.get(id)!).filter(Boolean);
  }, [selectedRoleIds, roles]);

  const toggleRole = (id: number) => {
    setSelectedRoleIds(prev => prev.includes(id) ? prev.filter(rid => rid !== id) : [...prev, id]);
  };

  const validate = () => {
    const errs: string[] = [];
    if (!fullName.trim()) errs.push('Nome completo é obrigatório.');
    if (!email.trim()) errs.push('E-mail é obrigatório.');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) errs.push('E-mail inválido.');
    if (errs.length) {
      setError(errs.join(' '));
      return false;
    }
    setError(null);
    return true;
  };

  const handleCreate = async () => {
    if (!validate()) return;
    if (!session) {
      setError('Sessão inválida.');
      return;
    }
    setIsSaving(true);
    setError(null);

    const { data, error, status } = await invokeEdgeFunction('admin-create-user', {
      email: email.trim(),
      full_name: fullName.trim(),
      roles: roleNamesForPayload,
    }, session.access_token);

    setIsSaving(false);

    if (error) {
      console.error('Erro ao criar usuário (edge):', error, 'status:', status);
      setError(error.message || 'Falha ao criar usuário.');
      return;
    }

    onCreated();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark-text flex items-center">
            <UserPlus className="w-5 h-5 mr-2 text-blue-600" /> Novo Usuário
          </h2>
          <button onClick={onClose} className="text-gray-600 hover:text-red-600">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-100 text-red-700 rounded-md text-sm">{error}</div>
          )}

          <TextInput
            id="fullName"
            label={<span className="flex items-center"><UserPlus className="w-4 h-4 mr-2 text-gray-500" /> Nome Completo</span>}
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Ex.: Maria Souza"
          />
          <TextInput
            id="email"
            type="email"
            label={<span className="flex items-center"><Mail className="w-4 h-4 mr-2 text-gray-500" /> E-mail</span>}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="email@empresa.com"
          />

          <div>
            <label className="block text-sm font-medium text-light-text mb-2 flex items-center">
              <Shield className="w-4 h-4 mr-2 text-gray-500" /> Papéis (opcional)
            </label>
            <div className="flex flex-wrap gap-2">
              {roles.map(r => {
                const checked = selectedRoleIds.includes(r.id);
                return (
                  <label key={r.id} className={`flex items-center gap-2 text-xs border px-2 py-1 rounded-md cursor-pointer ${checked ? 'bg-blue-50 border-blue-300' : 'bg-white border-gray-300'}`}>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleRole(r.id)}
                    />
                    {r.nome}
                  </label>
                );
              })}
              {roles.length === 0 && (
                <p className="text-xs text-gray-500">Nenhum papel cadastrado.</p>
              )}
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={isSaving}>
            {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Criar Usuário
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NewUserModal;