import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';

interface PublicImovel {
    id: string;
    codigo: string;
    bairro: string;
    logradouro: string;
    numero: string;
    
    dados_contrato: {
        venda_ativo: boolean;
        locacao_ativo: boolean;
        venda_disponibilidade: 'Disponível' | 'Indisponível';
        locacao_disponibilidade: 'Disponível' | 'Indisponível';
    };
    dados_valores: {
        valor_venda: number;
        valor_locacao: number;
    };
    dados_caracteristicas: {
        tipo_imovel: string;
        dormitorios: number;
        suites: number;
        banheiros: number;
        vagas_garagem: number;
        area_privativa_m2: number;
    };
    
    imagens_imovel: { url: string, rotation: number, ordem: number }[];
}

export const usePublicImoveis = () => {
    const [imoveis, setImoveis] = useState<PublicImovel[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchImoveis = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        // Busca imóveis que estão 'Aprovado'
        const { data, error } = await supabase
            .from('imoveis')
            .select(`
                id, codigo, bairro, logradouro, numero,
                dados_contrato, dados_valores, dados_caracteristicas,
                imagens_imovel(url, rotation, ordem)
            `)
            .eq('status_aprovacao', 'Aprovado')
            .order('created_at', { ascending: false })
            .limit(6); // Limita a 6 para destaques

        if (error) {
            console.error('Erro ao buscar imóveis públicos:', error);
            setError('Não foi possível carregar os imóveis em destaque.');
            setImoveis([]);
        } else {
            // Filtra no cliente para garantir que pelo menos uma finalidade ativa esteja 'Disponível'
            const availableImoveis = (data as PublicImovel[]).filter(imovel => {
                const { venda_ativo, locacao_ativo, venda_disponibilidade, locacao_disponibilidade } = imovel.dados_contrato;
                
                const isVendaAvailable = venda_ativo && venda_disponibilidade === 'Disponível';
                const isLocacaoAvailable = locacao_ativo && locacao_disponibilidade === 'Disponível';
                
                return isVendaAvailable || isLocacaoAvailable;
            }).map(imovel => {
                // Ordena as imagens para garantir que a primeira seja a principal
                if (imovel.imagens_imovel) {
                    imovel.imagens_imovel.sort((a, b) => a.ordem - b.ordem);
                }
                return imovel;
            });
            
            setImoveis(availableImoveis);
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchImoveis();
    }, [fetchImoveis]);

    return { imoveis, isLoading, error, fetchImoveis };
};