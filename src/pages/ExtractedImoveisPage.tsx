import React, { useEffect, useState, useCallback } from "react";
import { Loader2, Search, Download, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from '../integrations/supabase/client';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';

// Define a interface para os dados da linha, baseada na tabela imoveis_importados
interface ExtractedImovel {
    id: number; // Internal Supabase row ID (assuming it exists)
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

const ExtractedImoveisPage: React.FC = () => {
  const [data, setData] = useState<ExtractedImovel[]>([]);
  const [filteredData, setFilteredData] = useState<ExtractedImovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [limit, setLimit] = useState(20);

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

  // 🔹 Carrega dados do Supabase com paginação
  const fetchData = useCallback(async (pageNumber = 1) => {
    setLoading(true);
    const from = (pageNumber - 1) * limit;
    const to = from + limit - 1;

    const { data: fetchedData, error, count } = await supabase
      .from("imoveis_importados") // Alterado para a tabela correta
      .select("*, ID", { count: "exact" })
      .order("ID", { ascending: true })
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

  // 🔹 Atualiza célula (autosave)
  const handleEdit = async (id: number, field: string, value: any) => {
    setSaving(id);
    
    // Fields that are numeric in the database schema: Pagina (bigint), AreaPrivada (double precision), Dorms (bigint), ID (bigint)
    const numericFields = ["Pagina", "AreaPrivada", "Dorms", "ID"];
    
    let updatedValue = value;
    if (numericFields.includes(field)) {
        // Attempt to parse as float, use null if empty string
        updatedValue = value.trim() === '' ? null : parseFloat(value);
    }
    
    const { error } = await supabase
      .from("imoveis_importados") // Alterado para a tabela correta
      .update({ [field]: updatedValue })
      .eq("id", id); // Assumindo 'id' (lowercase) é a chave primária interna
      
    if (error) {
        console.error("Erro ao salvar:", error);
        alert(`Erro ao salvar ${field}: ${error.message}`);
    }
    else {
      // Atualiza o estado local para refletir a mudança
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, [field]: updatedValue } : item))
      );
    }
    setSaving(null);
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
                    <th key={col} className="border border-gray-300 px-3 py-2 whitespace-nowrap font-semibold text-dark-text">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((row) => (
                  <tr key={row.id} className="hover:bg-yellow-50 transition-colors">
                    {columns.map((col) => (
                      <td key={col} className="border border-gray-300 p-0 relative">
                        <Input
                          className="h-8 text-xs border-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                          defaultValue={row[col] ?? ''}
                          onBlur={(e) =>
                            e.target.value !== row[col]?.toString() &&
                            handleEdit(row.id, col, e.target.value)
                          }
                          disabled={saving === row.id}
                        />
                        {saving === row.id && (
                          <Loader2 className="w-3 h-3 animate-spin absolute right-1 top-1 text-primary-orange" />
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
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
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="h-9"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Anterior
          </Button>
          <Button
            variant="outline"
            disabled={page === totalPages}
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