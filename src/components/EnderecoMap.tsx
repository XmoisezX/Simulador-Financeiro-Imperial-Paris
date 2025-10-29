import React, { useState, useCallback } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2 } from 'lucide-react';
import ClientOnly from './ClientOnly';

// Corrige ícone padrão do Leaflet no React
if (typeof window !== 'undefined' && L.Icon) {
    delete (L.Icon.Default.prototype as any)._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });
}

// Componente principal que contém a lógica e o mapa
const EnderecoMapContent: React.FC = () => {
    const [cep, setCep] = useState("");
    const [numero, setNumero] = useState("");
    const [posicao, setPosicao] = useState<[number, number] | null>(null);
    const [endereco, setEndereco] = useState("");
    const [erro, setErro] = useState("");
    const [carregando, setCarregando] = useState(false);

    const buscarEndereco = useCallback(async () => {
        if (!cep || !numero) {
            setErro("Por favor, preencha o CEP e o número.");
            return;
        }

        setCarregando(true);
        setErro("");
        setPosicao(null);
        setEndereco("");

        try {
            // Remove caracteres não numéricos do CEP
            const cleanCep = cep.replace(/\D/g, '');
            
            const query = `${cleanCep} ${numero} Brasil`;
            
            // Adicionando User-Agent conforme boas práticas do Nominatim
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`,
                {
                    headers: {
                        'User-Agent': 'ImperialParisImoveisSimulator/1.0 (contato@imperialparis.com.br)'
                    }
                }
            );
            
            if (!res.ok) {
                 throw new Error(`Falha na busca: ${res.statusText}`);
            }
            
            const data = await res.json();

            if (data.length === 0) {
                setErro("Endereço não encontrado. Tente formatar o CEP (ex: 96010-160).");
            } else {
                const local = data[0];
                setPosicao([parseFloat(local.lat), parseFloat(local.lon)]);
                setEndereco(local.display_name);
            }
        } catch (err) {
            console.error(err);
            setErro("Erro ao buscar endereço. Verifique sua conexão.");
        } finally {
            setCarregando(false);
        }
    }, [cep, numero]);

    return (
        <div className="flex flex-col items-center p-6 space-y-4 w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl">
            <h1 className="text-2xl font-bold text-dark-text border-b border-gray-200 pb-2 w-full text-center">
                Buscar Endereço no Mapa
            </h1>

            <div className="w-full flex flex-col sm:flex-row gap-3">
                <input
                    type="text"
                    placeholder="CEP (ex: 96010-160)"
                    value={cep}
                    onChange={(e) => setCep(e.target.value)}
                    className="border border-gray-300 rounded-md p-2 w-full focus:ring-primary-orange focus:border-primary-orange transition-colors"
                />
                <input
                    type="number"
                    placeholder="Número"
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="border border-gray-300 rounded-md p-2 w-full focus:ring-primary-orange focus:border-primary-orange transition-colors"
                />
            </div>

            <button
                onClick={buscarEndereco}
                disabled={carregando}
                className="bg-primary-orange hover:bg-secondary-orange text-white font-medium px-4 py-2 rounded-lg w-full transition-colors disabled:opacity-50 flex items-center justify-center"
            >
                {carregando ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Buscando...</>
                ) : (
                    "Buscar Endereço"
                )}
            </button>

            {erro && <p className="text-red-600 text-sm p-2 bg-red-50 border border-red-200 rounded-md w-full">{erro}</p>}

            {posicao && (
                <div className="w-full h-96 rounded-lg overflow-hidden border border-gray-300 shadow-inner">
                    <MapContainer
                        center={posicao}
                        zoom={16}
                        scrollWheelZoom={true}
                        className="h-full w-full z-0"
                    >
                        <TileLayer
                            attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
                            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        />
                        <Marker position={posicao}>
                            <Popup>{endereco}</Popup>
                        </Marker>
                    </MapContainer>
                </div>
            )}
        </div>
    );
}

// Wrapper para garantir que o componente só seja renderizado no cliente
const EnderecoMap: React.FC = () => {
    return (
        <ClientOnly fallback={
            <div className="flex items-center justify-center h-96 w-full max-w-lg mx-auto bg-white rounded-lg shadow-xl">
                <Loader2 className="w-8 h-8 animate-spin text-primary-orange" />
                <p className="ml-3 text-gray-600">Carregando mapa...</p>
            </div>
        }>
            <EnderecoMapContent />
        </ClientOnly>
    );
};

export default EnderecoMap;