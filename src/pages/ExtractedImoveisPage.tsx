import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight, Save, ArrowUp, ArrowDown, AlertTriangle } from "lucide-react";
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import ExtractedImovelFilters, { ExtractedFilters } from '../components/ExtractedImovelFilters';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyHalfTone, parseCurrencyToNumber } from '../utils/format';

// Define a interface para os dados da linha, baseada na tabela imoveis_importados
interface ExtractedImovel {
    id: number; // Internal Supabase row ID (SERIAL PRIMARY KEY)
    "Responsáveis": 'Vazio' | 'Alessandro Gomes' | 'Tamires Torres' | 'Moisez Torres' | string | null; // NOVO: ENUM
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
    enderecoSearch: '',
    referenciaSearch: '', // NOVO FILTRO
};

const ExtractedImoveisPage: React.FC = () => {
  const [data, setData] = useState<ExtractedImovel[]>([]); // Dados brutos da página
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState(""); // Busca rápida agora é aplicada no servidor
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(20);
  const [fetchError, setFetchError] = useState<string | null>(null); // NOVO ESTADO DE ERRO
  
  // --- Estado de Ordenação ---
  const [sortColumn, setSortColumn] = useState<string>('id');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  
  // Estado dos filtros
  const [filters, setFilters] = useState<ExtractedFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<ExtractedFilters>(initialFilters);

  const columns = [
    "Responsáveis", 
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
  
  // Opções para o ENUM Responsáveis
  const responsavelOptions = ['Vazio', 'Alessandro Gomes', 'Tamires Torres', 'Moisez Torres'];
  
  // Larguras mínimas ajustadas
  const columnWidths: Record<string, string> = {
    "Responsáveis": "120px", 
    "Endereco": "180px",
    "NomeProprietario": "150px",
    "Referencia": "120px",
    "Categoria": "120px",
    "Bairro": "120px",
    "AreaTotal": "80px",
    "AreaPrivada": "80px",
    "Venda": "120px", 
    "Aluguel": "120px", 
    "Fones": "120px",
    "Email": "150px",
  };
  
  // Fields that are numeric in the database schema
  const numericFields = ["AreaPrivada", "Dorms", "ID"]; 

  // 🔹 Lógica de Busca de Dados (Aplicando filtros no servidor via RPC)
  const fetchData = useCallback(async (pageNumber = 1, currentFilters: ExtractedFilters, currentSearch: string, sortCol: string, sortDir: 'asc' | 'desc') => {
    setLoading(true);
    setFetchError(null); // Limpa erros anteriores
    
    const offset = (pageNumber - 1) * limit;

    try {
        // Chamada da função RPC para filtrar, paginar e ordenar no servidor
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
            p_endereco_search: currentFilters.enderecoSearch.trim() || null,
            p_sort_column: sortCol, // Novo parâmetro
            p_sort_direction: sortDir, // Novo parâmetro
            p_referencia_search: currentFilters.referenciaSearch.trim() || null, // NOVO PARÂMETRO
        });

        if (error) {
            console.error("Erro ao carregar dados via RPC:", error);
            setFetchError(`Falha ao carregar dados: ${error.message}. Verifique as permissões (RLS) ou a sintaxe da função SQL.`);
            setTotalRows(0);
            setData([]);
        } else if (fetchedData && fetchedData.length > 0) {
            const totalCount = fetchedData[0].total_count;
            setTotalRows(Number(totalCount));
            setData(fetchedData as ExtractedImovel[]);
        } else {
            setTotalRows(0);
            setData([]);
        }
    } catch (e) {
        console.error("Erro de rede/execução:", e);
        setFetchError("Erro de rede ou execução ao chamar a função do banco de dados.");
        setTotalRows(0);
        setData([]);
    } finally {
        setLoading(false);
    }
  }, [limit]);

  // Efeito para buscar dados quando a página, limite, filtros aplicados, busca rápida ou ordenação mudam
  useEffect(() => {
    fetchData(page, appliedFilters, search, sortColumn, sortDirection);
  }, [page, limit, appliedFilters, search, sortColumn, sortDirection, fetchData]);

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
  
  // 🔹 Lógica de Ordenação
  const handleSort = (column: string) => {
    if (sortColumn === column) {
        setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
        setSortColumn(column);
        setSortDirection('asc');
    }
    setPage(1); // Volta para a primeira página ao mudar a ordenação
  };


  // 🔹 Salva célula individualmente ao perder o foco
  const handleSaveCell = async (id: number, field: string, rawValue: string) => {
    
    let updatedValue: any = rawValue;
    
    if (numericFields.includes(field)) {
        // Lógica para campos numéricos
        updatedValue = rawValue.trim() === '' ? null : parseFloat(rawValue);
        if (isNaN(updatedValue as number)) updatedValue = rawValue;
    } else {
        // Lógica para campos de texto/ENUM
        updatedValue = rawValue.trim() === '' ? null : rawValue;
    }
    
    // 1. Atualiza o estado 'data' imediatamente para refletir a mudança na UI
    setData(prev => prev.map(item => 
        item.id === id ? { ...item, [field]: updatedValue } : item
    ));
    
    // 2. Salva no banco de dados
    setSaving(true);
    
    const dataToUpdate: Partial<ExtractedImovel> = { [field]: updatedValue };
    
    const { error } = await supabase
        .from("imoveis_importados")
        .update(dataToUpdate)
        .eq("id", id);
        
    setSaving(false);
    
    if (error) {
        console.error("Erro ao salvar célula:", error);
        alert(`Falha ao salvar a alteração: ${error.message}`);
        // Opcional: Recarregar dados para reverter a célula em caso de erro
        fetchData(page, appliedFilters, search, sortColumn, sortDirection);
    }
  };
  
  // 🔹 Exportar CSV (apenas dados visíveis)
  const exportCSV = useCallback(() => {
    const header = columns.join(",");
    const rows = data
      .map((r) => columns.map((c) => {
          return `"${r[c] ?? ""}"`;
      }).join(","))
      .join("\n");
    const csv = `${header}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imoveis_importados_pagina${page}.csv`;
    a.click();
  }, [data, columns, page]);
  
  // 🔹 Exportar PDF (apenas dados visíveis)
  const exportPDF = useCallback(() => {
    const doc = new jsPDF({
        orientation: 'landscape', // Tabela larga, melhor em paisagem
        unit: 'mm',
        format: 'a4'
    });

    const head = [columns];
    const body = data.map(row => columns.map(col => {
        return row[col] ?? '';
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
  }, [data, columns, page]);


  const totalPages = Math.ceil(totalRows / limit);
  
  // Resumo da paginação e filtragem
  const paginationSummary = `Página ${page} de ${totalPages} — ${totalRows} registros`;
  
  // O resumo da filtragem agora é sempre baseado no totalRows retornado pelo servidor
  const filterSummary = (appliedFilters.categoria || appliedFilters.bairro || appliedFilters.minDorms || appliedFilters.maxDorms || appliedFilters.minVenda || appliedFilters.maxVenda || appliedFilters.minAluguel || appliedFilters.maxAluguel || appliedFilters.andar || appliedFilters.enderecoSearch || appliedFilters.referenciaSearch || search)
    ? ` (Filtrando ${totalRows} resultados)` 
    : '';

  if (loading && data.length === 0)
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin w-6 h-6 text-blue-600" />
        <p className="ml-3 text-gray-600">Carregando dados extraídos...</p>
      </div>
    );
    
  if (fetchError) {
      return (
          <div className="p-8 bg-red-100 border border-red-400 text-red-700 rounded-md">
              <h2 className="text-xl font-bold flex items-center"><AlertTriangle className="w-6 h-6 mr-2" /> Erro ao Carregar Dados</h2>
              <p className="mt-2">{fetchError}</p>
              <p className="mt-4 text-sm">Se o erro persistir, verifique o console para detalhes sobre a chamada RPC.</p>
              <Button onClick={() => fetchData(page, appliedFilters, search, sortColumn, sortDirection)} className="mt-3 bg-red-600 hover:bg-red-700 text-white">
                  Tentar Recarregar
              </Button>
          </div>
      );
  }

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
          {/* Removido botão Salvar Alterações */}
          {saving && (
            <Button disabled className="h-9 bg-primary-orange text-white">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Salvando...
            </Button>
          )}
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
                        className="border border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-dark-text cursor-pointer hover:bg-gray-200 transition-colors"
                        style={{ minWidth: columnWidths[col] || '100px' }}
                        onClick={() => handleSort(col)}
                    >
                      <div className="flex items-center justify-between">
                        {col}
                        {sortColumn === col ? (
                            sortDirection === 'asc' ? <ArrowUp className="w-4 h-4 ml-1 text-blue-600" /> : <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />
                        ) : (
                            <ArrowUp className="w-4 h-4 ml-1 text-gray-300" />
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row) => {
                    return (
                        <tr key={row.id} className={`hover:bg-gray-50 transition-colors`}>
                            {columns.map((col) => {
                                
                                const currentValue = row[col] ?? '';
                                
                                // Coluna Responsáveis (Select para ENUM)
                                if (col === 'Responsáveis') {
                                    const isSelected = currentValue !== 'Vazio' && currentValue !== null && currentValue !== '';
                                    return (
                                        <td 
                                            key={col} 
                                            className="border border-gray-300 p-1 relative"
                                            style={{ minWidth: columnWidths[col] || '120px' }}
                                        >
                                            <select
                                                value={currentValue === null ? 'Vazio' : currentValue}
                                                onBlur={(e) => handleSaveCell(row.id, col, e.target.value)}
                                                onChange={(e) => {
                                                    // Atualiza o estado local imediatamente para feedback visual
                                                    setData(prev => prev.map(item => 
                                                        item.id === row.id ? { ...item, [col]: e.target.value } : item
                                                    ));
                                                }}
                                                className={`w-full h-full text-xs border-none focus:ring-0 p-1 text-gray-700 rounded-lg appearance-none cursor-pointer transition-colors 
                                                    ${isSelected ? 'bg-green-100' : 'bg-gray-100'}
                                                `}
                                                disabled={saving}
                                            >
                                                {responsavelOptions.map(option => (
                                                    <option key={option} value={option}>{option}</option>
                                                ))}
                                            </select>
                                        </td>
                                    );
                                }
                                
                                // Colunas Venda e Aluguel (Formatação de Moeda)
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
                                
                                // Outras colunas (Textarea editável com salvamento em onBlur)
                                return (
                                    <td 
                                        key={col} 
                                        className="border border-gray-300 p-0 relative"
                                        style={{ height: '60px' }} // Altura da célula
                                    >
                                        <textarea
                                            className={`w-full h-full text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent resize-none p-2 overflow-y-auto text-gray-700`}
                                            defaultValue={currentValue}
                                            onBlur={(e) => {
                                                // Salva se o valor mudou
                                                if (e.target.value !== currentValue?.toString()) {
                                                    handleSaveCell(row.id, col, e.target.value);
                                                }
                                            }}
                                            disabled={saving}
                                        />
                                    </td>
                                );
                            })}
                        </tr>
                    );
                })}
              </tbody>
            </table>
            {data.length === 0 && !loading && !fetchError && (
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