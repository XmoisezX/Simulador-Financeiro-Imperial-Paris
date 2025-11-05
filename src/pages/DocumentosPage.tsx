import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../integrations/supabase/client';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import TextInput from '../components/TextInput';
import { Loader2, Save, Plus, Trash2, FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

type DocType =
  | 'Contrato de Locação'
  | 'Proposta de Compra'
  | 'Reserva de locação'
  | 'Promessa de Compra e Venda';

interface Template {
  id: string;
  user_id: string;
  title: string;
  type: string;
  content: string | null;
  created_at: string;
  updated_at: string;
}

const DOC_TYPES: DocType[] = [
  'Contrato de Locação',
  'Proposta de Compra',
  'Reserva de locação',
  'Promessa de Compra e Venda',
];

const PLACEHOLDERS = [
  { label: 'Dados do locador', token: '{{LOCADOR_NOME}}' },
  { label: 'Dados do locatário', token: '{{LOCATARIO_NOME}}' },
  { label: 'Dados da imobiliária', token: '{{IMOBILIARIA_NOME}}' },
  { label: 'Dados do imóvel', token: '{{IMOVEL_ENDERECO}}' },
  { label: 'Data atual', token: '{{DATA_ATUAL}}' },
];

const DocumentosPage: React.FC = () => {
  const { session } = useAuth();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedType, setSelectedType] = useState<DocType>('Contrato de Locação');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = async () => {
    if (!session) return;
    setIsLoading(true);
    const { data, error } = await supabase
      .from('document_templates')
      .select('*')
      .eq('user_id', session.user.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Erro ao carregar templates:', error);
      setTemplates([]);
    } else {
      setTemplates((data || []) as Template[]);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTemplates();
  }, [session]);

  const loadTemplate = (t?: Template | null) => {
    if (!t) {
      setSelectedTemplateId(null);
      setTitle('');
      setContent('');
      return;
    }
    setSelectedTemplateId(t.id);
    setTitle(t.title || '');
    setSelectedType(t.type as DocType);
    setContent(t.content || '');
  };

  const handleInsertPlaceholder = (token: string) => {
    // insere token na posição do caret dentro do editor
    const editor = document.getElementById('doc-editor');
    if (!editor) return;
    editor.focus();
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) {
      editor.appendChild(document.createTextNode(token));
      setContent((prev) => prev + token);
      return;
    }
    const range = sel.getRangeAt(0);
    range.deleteContents();
    const node = document.createTextNode(token);
    range.insertNode(node);
    // move cursor after inserted token
    range.setStartAfter(node);
    range.collapse(true);
    sel.removeAllRanges();
    sel.addRange(range);
    // update state
    setContent(editor.innerHTML);
  };

  const handleSave = async () => {
    if (!session) return;
    if (!title.trim()) {
      setError('O título é obrigatório.');
      return;
    }
    setIsSaving(true);
    setError(null);

    const payload = {
      user_id: session.user.id,
      title: title.trim(),
      type: selectedType,
      content: content,
      updated_at: new Date().toISOString(),
    };

    try {
      if (selectedTemplateId) {
        const { error } = await supabase
          .from('document_templates')
          .update(payload)
          .eq('id', selectedTemplateId)
          .eq('user_id', session.user.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('document_templates')
          .insert(payload);
        if (error) throw error;
      }
      await fetchTemplates();
      // reload the template if it existed
      setSelectedTemplateId(null);
      setTitle('');
      setContent('');
    } catch (e: any) {
      console.error('Erro ao salvar template:', e);
      setError(e.message || 'Erro ao salvar');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Confirma exclusão deste modelo?')) return;
    setIsSaving(true);
    const { error } = await supabase.from('document_templates').delete().eq('id', id).eq('user_id', session?.user.id);
    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      await fetchTemplates();
      // clear editor if was the same
      if (selectedTemplateId === id) loadTemplate(null);
    }
    setIsSaving(false);
  };

  const templatesForType = useMemo(() => templates.filter(t => t.type === selectedType), [templates, selectedType]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-full">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-dark-text flex items-center gap-2"><FileText className="w-6 h-6 text-blue-600" /> Modelos de Documentos</h1>
        <div className="flex items-center gap-2">
          <Link to="/crm/documentos">
            <Button variant="outline">Documentos</Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardContent>
              <h3 className="font-semibold text-dark-text mb-2">Tipos</h3>
              <div className="space-y-2">
                {DOC_TYPES.map(dt => (
                  <button
                    key={dt}
                    onClick={() => { setSelectedType(dt); loadTemplate(null); }}
                    className={`w-full text-left px-3 py-2 rounded ${selectedType === dt ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'}`}
                  >
                    {dt}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold">Modelos ({templatesForType.length})</h4>
                <Button size="sm" onClick={() => loadTemplate(null)}><Plus className="w-4 h-4" /></Button>
              </div>
              <div className="space-y-2 max-h-[320px] overflow-y-auto">
                {templatesForType.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-2 border rounded">
                    <button className="text-left truncate" onClick={() => loadTemplate(t)} title={t.title}>{t.title}</button>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" onClick={() => loadTemplate(t)}>Abrir</Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(t.id)} className="text-red-600"><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                ))}
                {templatesForType.length === 0 && <p className="text-sm text-gray-500">Nenhum modelo para este tipo.</p>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <h4 className="font-semibold mb-2">Placeholders</h4>
              <div className="space-y-2">
                {PLACEHOLDERS.map(ph => (
                  <div key={ph.token} className="flex items-center justify-between">
                    <div className="text-sm">{ph.label}</div>
                    <button onClick={() => handleInsertPlaceholder(ph.token)} className="text-xs px-2 py-1 border rounded bg-white">Inserir</button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-3 space-y-4">
          <Card>
            <CardContent>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <TextInput id="templateTitle" label="Título do Modelo" value={title} onChange={(e) => setTitle(e.target.value)} />
                  <select value={selectedType} onChange={(e) => setSelectedType(e.target.value as DocType)} className="p-2 border rounded">
                    {DOC_TYPES.map(dt => <option key={dt} value={dt}>{dt}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={handleSave} className="bg-primary-orange hover:bg-secondary-orange text-white">
                    {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Salvar Modelo
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                  <div className="border rounded">
                    <div className="p-2 border-b bg-gray-50 text-sm">Editor (formatação básica)</div>
                    <div
                      id="doc-editor"
                      contentEditable
                      suppressContentEditableWarning
                      onInput={(e) => setContent((e.target as HTMLElement).innerHTML)}
                      className="min-h-[400px] p-4 text-sm"
                      dangerouslySetInnerHTML={{ __html: content }}
                      style={{ outline: 'none', background: 'white' }}
                    />
                  </div>
                </div>

                <div>
                  <div className="p-3 border rounded bg-gray-50">
                    <h4 className="font-semibold mb-2">Ações Rápidas</h4>
                    <div className="space-y-2">
                      <button onClick={() => {
                        // limpar
                        setContent('');
                        const editor = document.getElementById('doc-editor');
                        if (editor) editor.innerHTML = '';
                      }} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Limpar Editor</button>
                      <button onClick={() => {
                        const editor = document.getElementById('doc-editor');
                        if (editor) {
                          navigator.clipboard.writeText(editor.innerText || '');
                          alert('Texto copiado para a área de transferência (apenas texto).');
                        }
                      }} className="w-full text-left px-3 py-2 rounded hover:bg-gray-100">Copiar Texto</button>
                    </div>
                  </div>

                  <div className="mt-4 p-3 border rounded bg-gray-50">
                    <h4 className="font-semibold mb-2">Pré-visualização (limpa)</h4>
                    <div className="min-h-[120px] p-2 bg-white text-sm" dangerouslySetInnerHTML={{ __html: content }} />
                  </div>
                </div>
              </div>

              {error && <div className="text-red-600 mt-3">{error}</div>}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DocumentosPage;