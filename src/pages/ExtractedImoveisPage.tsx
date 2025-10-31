import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ExtractedImovelFilters, { ExtractedFilters } from '../components/ExtractedImovelFilters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyHalfTone, parseCurrencyToNumber } from '../utils/format';
import ExtractedUserSelect from '../components/ExtractedUserSelect';

// Define a interface para os dados da linha, baseada na tabela imoveis_importados
interface ExtractedImovel {
    id: number; // Internal Supabase row ID (SERIAL PRIMARY KEY)
    responsible_user_id: string | null; // Agora armazena o NOME do responsável (string)
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

const initialFilters: ExtractedFilters = {
    minVenda: null,
    maxVenda: null,
    minAluguel: null,
    maxAluguel: null,
    minDorms: null,
    maxDorms: null,
    minSuites: null,
    maxSuites: null,
    minVagas: null,
    maxVagas: null,
    bairro: '',
    categoria: '',
    andar: null,
    enderecoSearch: '', // NOVO CAMPO
};

const ExtractedImoveisPage: React.FC = () => {
  const [data, setData] = useState<ExtractedImovel[]>([]); // Dados brutos da página (sem filtro de busca rápida)
  const [filteredData, setFilteredData] = useState<ExtractedImovel[]>([]); // Dados após filtro de busca rápida e filtros de valor
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(""); // Busca rápida agora é aplicada no servidor
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(20);
  const [pendingChanges, setPendingChanges] = useState<PendingChanges>({});
  
  // Estado dos filtros
  const [filters, setFilters] = useState<ExtractedFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExtractedFilters>(initialFilters);

  const columns = [
    "Responsavel", // New column replacing "Pagina"
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
  
  // Larguras mínimas ajustadas para tentar caber mais na tela
  const columnWidths: Record<string, string> = {
    "Responsavel": "150px", // New width
    "Endereco": "180px",
    "NomeProprietario": "150px",
    "Referencia": "120px",
    "Categoria": "120px",
    "Bairro": "120px",
    "AreaTotal": "80px",
    "AreaPrivada": "80px",
    "Venda": "120px", // Increased width for currency
    "Aluguel": "120px", // Increased width for currency
    "Fones": "120px",
    "Email": "150px",
  };
  
  // Fields that are numeric in the database schema
  const numericFields = ["AreaPrivada", "Dorms", "ID"];

  // 🔹 Lógica de Busca de Dados (Aplicando filtros no servidor via RPC)
  const fetchData = useCallback(async (pageNumber = 1, currentFilters: ExtractedFilters, currentSearch: string) => {
    setLoading(true);
    setPendingChanges({}); 
    
    const offset = (pageNumber - 1) * limit;

    // Chamada da função RPC para filtrar e paginar no servidor
    const { data: fetchedData, error } = await supabase.rpc('filter_imoveis_importados', {
        p_search: currentSearch.trim() || null,
        p_min_venda: currentFilters.minVenda,
        p_max_venda: currentFilters.maxVenda,
        p_min_aluguel: currentFilters.minAluguel,
        p_max_aluguel: currentFilters.maxAluguel,
        p_min_dorms: currentFilters.minDorms,
        p_max_dorms: currentFilters.maxDorms,
        p_categoria: currentFilters.categoria || null,
        p_bairro: currentFilters.bairro || null,
        p_limit: limit,
        p_offset: offset,
        p_andar: currentFilters.andar,
        p_endereco_search: currentFilters.enderecoSearch.trim() || null, // NOVO PARÂMETRO
    });

    if (error) {
        console.error("Erro ao carregar dados via RPC:", error);
    } else if (fetchedData && fetchedData.length > 0) {
        // O total_count vem na primeira linha do resultado da RPC
        const totalCount = fetchedData[0].total_count;
        setTotalRows(Number(totalCount));
        setData(fetchedData as ExtractedImovel[]);
        setFilteredData(fetchedData as ExtractedImovel[]); // Não há mais filtro no cliente, então filteredData = data
    } else {
        setTotalRows(0);
        setData([]);
        setFilteredData([]);
    }
    setLoading(false);
  }, [limit]);

  // Efeito para buscar dados quando a página, limite, filtros aplicados ou busca rápida mudam
  useEffect(() => {
    fetchData(page, appliedFilters, search);
  }, [page, limit, appliedFilters, search, fetchData]);

  // 🔹 Handlers do componente de filtro
  const handleFilterChange = useCallback((key: keyof ExtractedFilters, value: string | number | null) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);
  
  const handleApplyFilters = useCallback(() => {
    setAppliedFilters(filters);
    setPage(1); // Volta para a primeira página ao aplicar novos filtros
  }, [filters]);
  
  const handleClearFilters = useCallback(() => {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
    setPage(1);
    setSearch('');
  }, []);


  // 🔹 Atualiza célula (apenas no estado local)
  const handleEdit = (id: number, field: string, value: any) => {
    
    // Se for a coluna Responsavel, o salvamento é tratado pelo componente ExtractedUserSelect
    if (field === 'responsible_user_id') {
        // Apenas atualiza o estado local, pois o componente filho já chamou a API
        setData(prev => prev.map(item => 
            item.id === id ? { ...item, responsible_user_id: value } : item
        ));
        // Não rastreamos em pendingChanges
        return;
    }
    
    let updatedValue = value;
    
    if (numericFields.includes(field)) {
        updatedValue = value.trim() === '' ? null : parseFloat(value);
        if (isNaN(updatedValue as number)) updatedValue = value;
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
        
        const dataToUpdate: Partial<ExtractedImovel> = {};
        for (const [key, value] of Object.entries(changes)) {
            // Trata campos nulos para o banco de dados
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
    setPendingChanges({}); 
    
    if (errorCount > 0) {
        alert(`Salvo com ${successCount} sucesso(s) e ${errorCount} falha(s). Verifique o console para detalhes.`);
    } else {
        alert(`Todas as ${successCount} alterações foram salvas com sucesso!`);
    }
    
    // Recarrega a página atual para garantir a consistência dos dados
    fetchData(page, appliedFilters, search);
  };

  // 🔹 Exportar CSV (apenas dados visíveis)
  const exportCSV = () => {
    const header = columns.join(",");
    const rows = filteredData
      .map((r) => columns.map((c) => {
          // Mapeia o campo correto para a exportação
          const fieldName = c === 'Responsavel' ? 'responsible_user_id' : c;
          return `"${r[fieldName] ?? ""}"`;
      }).join(","))
      .join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imoveis_importados_pagina${page}.csv`;
    a.click();
  };
  
  // 🔹 Exportar PDF (apenas dados visíveis)
  const exportPDF = () => {
    const doc = new jsPDF({
        orientation: 'landscape', // Tabela larga, melhor em paisagem
        unit: 'mm',
        format: 'a4'
    });

    const head = [columns];
    const body = filteredData.map(row => columns.map(col => {
        const fieldName = col === 'Responsavel' ? 'responsible_user_id' : col;
        return row[fieldName] ?? '';
    }));

    autoTable(doc, {
        head: head,
        body: body,
        startY: 10,
        theme: 'grid',
        styles: {
            fontSize: 6,
            cellPadding: 1,
        },
        headStyles: {
            fillColor: [30, 58, 138], // Azul escuro
            textColor: 255,
            fontStyle: 'bold',
        },
        margin: { top: 10, left: 5, right: 5, bottom: 10 },
        didDrawPage: function (data) {
            // Adiciona título e número da página
            doc.setFontSize(10);
            doc.text("Relatório de Imóveis Importados", data.settings.margin.left, 5);
            doc.text(`Página ${data.pageNumber}`, doc.internal.pageSize.width - data.settings.margin.right, 5, { align: 'right' });
        }
    });

    doc.save(`imoveis_importados_pagina${page}.pdf`);
  };


  const totalPages = Math.ceil(totalRows / limit);
  const hasPendingChanges = Object.keys(pendingChanges).length > 0;
  
  // Resumo da paginação e filtragem
  const paginationSummary = `Página ${page} de ${totalPages} — ${totalRows} registros`;
  
  // O resumo da filtragem agora é sempre baseado no totalRows retornado pelo servidor
  const filterSummary = (appliedFilters.categoria || appliedFilters.bairro || appliedFilters.minDorms || appliedFilters.maxDorms || appliedFilters.minVenda || appliedFilters.maxVenda || appliedFilters.minAluguel || appliedFilters.maxAluguel || appliedFilters.andar || appliedFilters.enderecoSearch || search)
    ? ` (Filtrando ${totalRows} resultados)` 
    : '';

  if (loading && data.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
        <p className="ml-3 text-gray-600">Carregando dados extraídos...</p>
      </div>
    );

  // Componente de Paginação Duplicado
  const PaginationControls = () => (
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
            disabled={page >= totalPages || saving}
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
              placeholder="Buscar em todo o banco de dados..."
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
          <Button onClick={exportPDF} variant="outline" className="h-9 text-red-600 border-red-600 hover:bg-red-50">
            <Download className="w-4 h-4 mr-2" /> Exportar PDF
          </Button>
        </div>
      </div>
      
      {/* Filtro Inteligente */}
      <ExtractedImovelFilters 
        filters={filters}
        onFilterChange={handleFilterChange}
        onApply={handleApplyFilters}
        onClear={handleClearFilters}
      />
      
      {/* Resumo da Paginação (Topo) */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-500 font-semibold">
          {paginationSummary} {filterSummary}
        </div>
        <PaginationControls />
      </div>

      {/* Tabela */}
      <Card className="shadow-lg">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100 text-left sticky top-0 z-10">
                  {columns.map((col) => (
                    <th 
                        key={col} 
                        className="border border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-dark-text"
                        style={{ minWidth: columnWidths[col] || '100px' }} // Usando 100px como fallback
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
                                
                                const fieldName = col === 'Responsavel' ? 'responsible_user_id' : col;
                                const currentValue = row[fieldName] ?? '';
                                const isCellPending = isRowPending && pendingChanges[row.id] && pendingChanges[row.id][fieldName] !== undefined;
                                
                                // 1. Coluna Responsável (Select com salvamento imediato)
                                if (col === 'Responsavel') {
                                    return (
                                        <td 
                                            key={col} 
                                            className="border border-gray-300 p-0 relative"
                                            style={{ minWidth: columnWidths[col] || '150px' }}
                                        >
                                            <ExtractedUserSelect 
                                                imovelId={row.id}
                                                currentUserName={row.responsible_user_id}
                                                onUpdate={(newUserName) => handleEdit(row.id, 'responsible_user_id', newUserName)}
                                            />
                                        </td>
                                    );
                                }
                                
                                // 2. Colunas Venda e Aluguel (Formatação de Moeda)
                                if (col === 'Venda' || col === 'Aluguel') {
                                    return (
                                        <td 
                                            key={col} 
                                            className="border border-gray-300 p-0 relative text-right"
                                            style={{ minWidth: columnWidths[col] || '120px' }}
                                        >
                                            <div className="p-2">
                                                {formatCurrencyHalfTone(currentValue)}
                                            </div>
                                        </td>
                                    );
                                }
                                
                                // 3. Outras colunas (Textarea editável com salvamento em lote)
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

      {/* Paginação (Rodapé) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-gray-500 font-semibold">
          {paginationSummary} {filterSummary}
        </div>
        <PaginationControls />
      </div>
    </div>
  );
}

export default ExtractedImoveisPage;