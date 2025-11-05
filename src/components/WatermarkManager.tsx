"use client";

import React, { useRef, useState, useEffect } from 'react';
import { Upload, Trash2, Image, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import toast from 'react-hot-toast';
import { Button } from './ui/Button';

const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB recommended
const WATERMARK_PATH = 'watermark.png';
const BUCKET = 'site-assets';

const WatermarkManager: React.FC = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [exists, setExists] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchExisting = async () => {
    setIsLoading(true);
    try {
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(WATERMARK_PATH);
      if (data?.publicUrl) {
        setPreviewUrl(data.publicUrl);
        setExists(true);
      } else {
        setPreviewUrl(null);
        setExists(false);
      }
    } catch (e) {
      console.warn('Erro ao obter watermark:', e);
      setPreviewUrl(null);
      setExists(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchExisting();
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error('Formato inválido. Use PNG/JPG/WEBP.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Arquivo muito grande. Máx 2MB recomendado.');
      return;
    }

    // Optionally, validate dimensions
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = async () => {
      if (img.width !== 426 || img.height !== 240) {
        // warn but allow upload
        toast(`Tamanho recomendado 426x240px. Detectado: ${img.width}x${img.height}`);
      }
      URL.revokeObjectURL(objectUrl);
      // Upload
      setUploading(true);
      try {
        const { error } = await supabase.storage.from(BUCKET).upload(WATERMARK_PATH, file, {
          cacheControl: '3600',
          upsert: true,
          contentType: file.type,
        });
        if (error) {
          console.error('Erro upload watermark:', error);
          toast.error('Erro ao enviar a marca d\'água.');
        } else {
          const { data } = supabase.storage.from(BUCKET).getPublicUrl(WATERMARK_PATH);
          if (data?.publicUrl) {
            setPreviewUrl(data.publicUrl);
            setExists(true);
            toast.success('Marca d\'água salva com sucesso.');
          }
        }
      } catch (err) {
        console.error(err);
        toast.error('Erro inesperado ao enviar marca d\'água.');
      } finally {
        setUploading(false);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      toast.error('Não foi possível ler a imagem selecionada.');
    };
    img.src = objectUrl;
  };

  const handleRemove = async () => {
    if (!confirm('Remover a marca d\'água do sistema? Essa ação não remove marcas já aplicadas em imagens existentes no storage.')) return;
    setUploading(true);
    try {
      const { error } = await supabase.storage.from(BUCKET).remove([WATERMARK_PATH]);
      if (error) {
        console.error('Erro ao remover watermark:', error);
        toast.error('Falha ao remover marca d\'água.');
      } else {
        setPreviewUrl(null);
        setExists(false);
        toast.success('Marca d\'água removida.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Erro inesperado ao remover marca.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-4 bg-white rounded-lg shadow-md border border-gray-200">
      <h3 className="text-lg font-semibold text-dark-text mb-2 flex items-center"><Image className="w-5 h-5 mr-2 text-primary-orange" /> Marca d'água do site</h3>
      <p className="text-sm text-gray-500 mb-3">Envie uma imagem (recomendada 426x240px PNG) que será aplicada automaticamente como marca d'água nas imagens ao serem otimizadas.</p>

      <div className="flex items-center gap-4">
        <input type="file" accept={ALLOWED_TYPES.join(',')} ref={inputRef} onChange={handleFileChange} className="hidden" />
        <Button onClick={() => inputRef.current?.click()} className="bg-primary-orange hover:bg-secondary-orange text-white">
          <Upload className="w-4 h-4 mr-2" /> Enviar marca d'água
        </Button>

        {exists && (
          <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50" onClick={handleRemove} disabled={uploading}>
            <Trash2 className="w-4 h-4 mr-2" /> Remover
          </Button>
        )}
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="flex items-center">
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-blue-600" /> Carregando...
          </div>
        ) : previewUrl ? (
          <div className="border rounded p-2 inline-block">
            <img src={previewUrl} alt="Marca d'água" width={213} height={120} style={{ width: 213, height: 120, objectFit: 'cover' }} />
            <p className="text-xs text-gray-500 mt-1">Preview (reduzido). Arquivo salvo em <strong>{BUCKET}/{WATERMARK_PATH}</strong></p>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Nenhuma marca d'água configurada.</p>
        )}
      </div>
    </div>
  );
};

export default WatermarkManager;