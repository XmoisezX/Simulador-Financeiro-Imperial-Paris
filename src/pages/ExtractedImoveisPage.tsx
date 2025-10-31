import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

// Define a interface para os dados da linha, baseada na tabela imoveis_importados
interface ExtractedImovel {
    id: number; // Internal Supabase row ID (SERIAL PRIMARY KEY)
    Pagina: number | null; // bigint
    Referencia: string | null;
    Categoria: string | null;
    Endereco: string | null;
    Bairro: string | null;
    AreaTotal: string | null; // text
    AreaPrivada: number | null; // double precision
    Dorms: number | null; // bigint
    Suites: string | null; // text
    Vagas: string | null; // text
    Venda: string | null; // text
    Aluguel: string | null; // text
    NomeProprietario: string | null;
    Fones: string | null;
    Email: string | null;
    Exclusivo: string | null;
    ID: number | null; // Imported ID (bigint)
    [key: string]: any; // Permite acesso dinâmico às colunas
}

// Tipo para rastrear alterações pendentes: { [rowId]: { [columnName]: newValue } }
type PendingChanges = Record<number, Partial<ExtractedImovel>>;

const ExtractedImoveisPage: React.FC = () => {
  const [data, setData] = useState<ExtractedImovel[]>([]);
  const [filteredData, setFilteredData] = useState<ExtractedImovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});

  const columns = [
    "Pagina",
    "Referencia",
    "Categoria",
    "Endereco",
    "Bairro",
    "AreaTotal",
    "AreaPrivada",
    "Dorms",
    "Suites",
    "Vagas",
    "Venda",
    "Aluguel",
    "NomeProprietario",
    "Fones",
    "Email",
    "Exclusivo",
    "ID",
  ];
  
  // Larguras mínimas para as colunas (em pixels)
  const columnWidths: Record<string, string> = {
    "Endereco": "250px",
    "NomeProprietario": "200px",
    "Referencia": "150px",
    "Categoria": "150px",
    "Bairro": "150px",
    "AreaTotal": "100px",
    "AreaPrivada": "100px",
    "Venda": "120px",
    "Aluguel": "120px",
    "Fones": "150px",
    "Email": "200px",
  };
  
  // Fields that are numeric in the database schema
  const numericFields = ["Pagina", "AreaPrivada", "Dorms", "ID"];

  // 🔹 Carrega dados do Supabase com paginação
  const fetchData = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    setPendingChanges({}); // Limpa alterações pendentes ao carregar nova página
    const from = (pageNumber - 1) * limit;
    const to = from + limit - 1;

    const { data: fetchedData, error, count } = await supabase
      .from("imoveis_importados")
      .select("*, id", { count: "exact" })
      .order("id", { ascending: true })
      .range(from, to);

    if (error) console.error("Erro ao carregar dados:", error);
    else {
      setData(fetchedData || []);
      setFilteredData(fetchedData || []);
      setTotalRows(count || 0);
    }
    setLoading(false);
  }, [limit]);

  useEffect(() => {
    fetchData(page);
  }, [page, limit, fetchData]);

  // 🔹 Filtro de busca (aplica no bloco atual)
  useEffect(() => {
    if (!search.trim()) return setFilteredData(data);
    const lower = search.toLowerCase();
    setFilteredData(
      data.filter((row) =>
        columns.some(
          (col) => row[col] && row[col].toString().toLowerCase().includes(lower)
        )
      )
    );
  }, [search, data, columns]);

  // 🔹 Atualiza célula (apenas no estado local)
  const handleEdit = (id: number, field: string, value: any) => {
    
    let updatedValue = value;
    if (numericFields.includes(field)) {
        // Tenta converter para número, usa null se for string vazia
        updatedValue = value.trim() === '' ? null : parseFloat(value);
        if (isNaN(updatedValue as number)) updatedValue = value; // Mantém a string se a conversão falhar
    }
    
    setPendingChanges(prev => ({
        ...prev,
        [id]: {
            ...prev[id],
            [field]: updatedValue,
        }
    }));
    
    // Atualiza o estado 'data' imediatamente para refletir a mudança na UI
    setData(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: updatedValue } : item
    ));
  };
  
  // 🔹 Salva todas as alterações pendentes
  const handleSaveAll = async () => {
    if (Object.keys(pendingChanges).length === 0) {
        alert("Nenhuma alteração pendente para salvar.");
        return;
    }
    
    setSaving(true);
    let successCount = 0;
    let errorCount = 0;
    
    const updates = Object.entries(pendingChanges).map(([idStr, changes]) => {
        const id = parseInt(idStr);
        
        // Prepara os dados para o Supabase
        const dataToUpdate: Partial<ExtractedImovel> = {};
        for (const [key, value] of Object.entries(changes)) {
            // Garante que valores numéricos sejam tratados como null se forem strings vazias
            if (numericFields.includes(key) && (value === null || value === '')) {
                dataToUpdate[key] = null;
            } else {
                dataToUpdate[key] = value;
            }
        }
        
        return supabase
            .from("imoveis_importados")
            .update(dataToUpdate)
            .eq("id", id);
    });
    
    const results = await Promise.all(updates);
    
    results.forEach(result => {
        if (result.error) {
            console.error("Erro ao salvar lote:", result.error);
            errorCount++;
        } else {
            successCount++;
        }
    });
    
    setSaving(false);
    setPendingChanges({}); // Limpa as alterações após a tentativa de salvar
    
    if (errorCount > 0) {
        alert(`Salvo com ${successCount} sucesso(s) e ${errorCount} falha(s). Verifique o console para detalhes.`);
    } else {
        alert(`Todas as ${successCount} alterações foram salvas com sucesso!`);
    }
    
    // Recarrega a página atual para garantir a consistência dos dados
    fetchData(page);
  };

  // 🔹 Exportar CSV (apenas dados visíveis)
  const exportCSV = () => {
    const header = columns.join(",");
    const rows = filteredData
      .map((r) => columns.map((c) => `"${r[c] ?? ""}"`).join(","))
      .join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imoveis_importados_pagina${page}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(totalRows / limit);
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  if (loading && data.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
        <p className="ml-3 text-gray-600">Carregando dados extraídos...</p>
      </div>
    );

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-bold text-dark-text">
            <Search className="w-6 h-6 mr-2 inline text-blue-600" /> Imóveis Importados (Tabela Direta)
        </h1>

        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar no bloco atual..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 w-64 h-9"
            />
          </div>
          <Button 
            onClick={handleSaveAll} 
            disabled={saving || !hasPendingChanges}
            className="h-9 bg-primary-orange hover:bg-secondary-orange text-white"
          >
            {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Salvar Alterações ({Object.keys(pendingChanges).length})
          </Button>
          <Button onClick={exportCSV} variant="outline" className="h-9 text-green-600 border-green-600 hover:bg-green-50">
            <Download className="w-4 h-4 mr-2" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Tabela */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[70vh]">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left sticky top-0 z-10">
                  {columns.map((col) => (
                    <th 
                        key={col} 
                        className="border border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-dark-text"
                        style={{ minWidth: columnWidths[col] || '120px' }} // Aplica largura mínima
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => {
                    const isRowPending = !!pendingChanges[row.id];
                    return (
                        <tr key={row.id} className={`hover:bg-yellow-50 transition-colors ${isRowPending ? 'bg-yellow-100' : ''}`}>
                            {columns.map((col) => {
                                // Usa o valor do estado 'data' que inclui as alterações pendentes
                                const currentValue = row[col] ?? '';
                                const isCellPending = isRowPending && pendingChanges[row.id] && pendingChanges[row.id][col] !== undefined;
                                
                                return (
                                    <td 
                                        key={col} 
                                        className="border border-gray-300 p-0 relative"
                                        style={{ height: '60px' }} // Altura da célula
                                    >
                                        <textarea
                                            className={`w-full h-full text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 overflow-y-auto ${isCellPending ? 'font-bold text-dark-text' : 'text-gray-700'}`}
                                            defaultValue={currentValue}
                                            onBlur={(e) => {
                                                // Verifica se o valor mudou antes de chamar handleEdit
                                                if (e.target.value !== currentValue?.toString()) {
                                                    handleEdit(row.id, col, e.target.value);
                                                }
                                            }}
                                            // Usamos defaultValue e onBlur para evitar re-renderizações constantes
                                        />
                                        {isCellPending && (
                                            <span className="absolute right-1 top-1 text-xs text-primary-orange" title="Alteração pendente">*</span>
                                        )}
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
              </tbody>
            </table>
            {filteredData.length === 0 && !loading && (
                <div className="text-center py-10 text-gray-500">Nenhum registro encontrado na página atual.</div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Paginação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500">
          Página {page} de {totalPages} — {totalRows} registros
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            disabled={page === 1 || saving}
            onClick={() => setPage((p) => p - 1)}
            className="h-9"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page === totalPages || saving}
            onClick={() => setPage((p) => p + 1)}
            className="h-9"
          >
            Próxima <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
          <select
            className="border rounded px-2 py-1 text-sm h-9 bg-white"
            value={limit}
            onChange={(e) => {
                setLimit(Number(e.target.value));
                setPage(1); // Reset page when limit changes
            }}
            disabled={saving}
          >
            {[10, 20, 50, 100].map((n) => (
              <option key={n} value={n}>
                {n} por página
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

export default ExtractedImoveisPage;