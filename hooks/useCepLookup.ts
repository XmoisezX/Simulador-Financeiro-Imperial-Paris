import { useState, useCallback } from 'react';

interface CepData {
    cep: string;
    logradouro: string;
    complemento: string;
    bairro: string;
    localidade: string; // Cidade
    uf: string; // Estado
    ibge: string;
    gia: string;
    ddd: string;
    siafi: string;
}

interface UseCepLookupResult {
    data: CepData | null;
    loading: boolean;
    error: string | null;
    lookup: (cep: string) => Promise<void>;
}

export const useCepLookup = (): UseCepLookupResult => {
    const [data, setData] = useState<CepData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const lookup = useCallback(async (cep: string) => {
        // Remove non-digit characters
        const cleanCep = cep.replace(/\D/g, '');

        if (cleanCep.length !== 8) {
            setError('CEP deve conter 8 dígitos.');
            setData(null);
            return;
        }

        setLoading(true);
        setError(null);
        setData(null);

        try {
            const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
            const result = await response.json();

            if (result.erro) {
                setError('CEP não encontrado.');
                return;
            }

            setData({
                cep: result.cep,
                logradouro: result.logradouro,
                complemento: result.complemento,
                bairro: result.bairro,
                localidade: result.localidade,
                uf: result.uf,
                ibge: result.ibge,
                gia: result.gia,
                ddd: result.ddd,
                siafi: result.siafi,
            });

        } catch (err) {
            setError('Erro ao buscar CEP. Verifique sua conexão.');
        } finally {
            setLoading(false);
        }
    }, []);

    return { data, loading, error, lookup };
};