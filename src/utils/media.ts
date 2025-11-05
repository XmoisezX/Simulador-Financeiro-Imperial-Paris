import { supabase } from '../integrations/supabase/client';
import { ImovelImage, CondominioMedia } from '../../types';
import toast from 'react-hot-toast';

/**
 * Resize + convert image file to WebP using canvas.
 * If watermarkUrl is provided, it will be drawn on top-right or bottom-right depending on canvas.
 * Returns a Blob (WebP) ready for upload.
 */
const loadImageElement = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(new Error('Falha ao carregar imagem para processamento.'));
    img.src = src;
  });

const fileToImageSrc = (file: File): string => {
  return URL.createObjectURL(file);
};

const composeWithWatermark = async (
  img: HTMLImageElement,
  watermarkImg: HTMLImageElement | null,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8
): Promise<Blob> => {
  // Calculate target size while preserving aspect ratio
  let targetWidth = img.width;
  let targetHeight = img.height;

  const aspect = img.width / img.height;

  if (img.width > maxWidth || img.height > maxHeight) {
    if (img.width / maxWidth > img.height / maxHeight) {
      targetWidth = maxWidth;
      targetHeight = Math.round(maxWidth / aspect);
    } else {
      targetHeight = maxHeight;
      targetWidth = Math.round(maxHeight * aspect);
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas não suportado');

  // Draw main image
  ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

  // If watermark provided, draw it scaled to ~20% width (or to provided watermark size)
  if (watermarkImg) {
    // Desired watermark width ~ 20% of image width but max watermark original width
    const wmMaxWidth = Math.round(targetWidth * 0.20);
    const wmAspect = watermarkImg.width / watermarkImg.height;
    const wmWidth = Math.min(wmMaxWidth, watermarkImg.width);
    const wmHeight = Math.round(wmWidth / wmAspect);

    // position: bottom-right with 8px padding
    const pad = Math.round(Math.max(8, targetWidth * 0.01));
    const x = targetWidth - wmWidth - pad;
    const y = targetHeight - wmHeight - pad;

    // Apply slight transparency for watermark
    ctx.globalAlpha = 0.85;
    ctx.drawImage(watermarkImg, x, y, wmWidth, wmHeight);
    ctx.globalAlpha = 1;
  }

  // Convert to WebP blob
  return await new Promise<Blob | null>((resolve) => {
    // @ts-ignore to satisfy TS for toBlob callback
    canvas.toBlob((blob: Blob | null) => resolve(blob), 'image/webp', quality);
  }) as Promise<Blob>;
};

const optimizeImageFile = async (file: File, watermarkUrl: string | null = null): Promise<Blob> => {
  try {
    const src = fileToImageSrc(file);
    const imgEl = await loadImageElement(src);

    // attempt to load watermark if provided
    let watermarkImg: HTMLImageElement | null = null;
    if (watermarkUrl) {
      try {
        watermarkImg = await loadImageElement(watermarkUrl);
      } catch (e) {
        console.warn('Não foi possível carregar a marca d\'água:', e);
        watermarkImg = null;
      }
    }

    // define max target size (e.g., 1920x1080) to keep images reasonable
    const maxWidth = 1920;
    const maxHeight = 1920;

    const blob = await composeWithWatermark(imgEl, watermarkImg, maxWidth, maxHeight, 0.8);

    // revoke object URL of file
    try {
      URL.revokeObjectURL(src);
    } catch (e) {
      /* ignore */
    }

    return blob;
  } catch (err) {
    console.error('Erro ao otimizar imagem:', err);
    // fallback: return original file as blob
    return file;
  }
};

/**
 * Faz o upload otimizado de uma lista de imagens para o Supabase Storage e retorna os metadados.
 * Aplica otimização (WebP, resize) e marca d'água (se houver) antes do upload.
 */
export const uploadImovelMedia = async (images: ImovelImage[], userId: string, imovelId: string) => {
    const uploadedMedia: { id: string, url: string, legend: string, is_visible: boolean, rotation: number, ordem: number }[] = [];

    // Fetch watermark URL if exists
    let watermarkUrl: string | null = null;
    try {
      const { data } = supabase.storage.from('site-assets').getPublicUrl('watermark.png');
      if (data && data.publicUrl) watermarkUrl = data.publicUrl;
    } catch (e) {
      console.warn('Erro ao obter watermark public url:', e);
      watermarkUrl = null;
    }

    for (const image of images) {
        try {
            // If image has no file, skip (existing image)
            if (!image.file) {
                continue;
            }

            // Optimize + watermark
            const optimizedBlob = await optimizeImageFile(image.file as File, watermarkUrl);
            const optimizedFile = new File([optimizedBlob], `${image.id}.webp`, { type: 'image/webp' });

            const filePath = `imoveis/${imovelId}/${image.id}-${optimizedFile.name}`;

            const { error: uploadError } = await supabase.storage
                .from('imovel-media')
                .upload(filePath, optimizedFile, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: 'image/webp',
                });

            if (uploadError) {
                console.error(`Erro ao fazer upload da imagem ${image.id}:`, uploadError);
                toast.error(`Erro ao enviar imagem ${image.id}: ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('imovel-media')
                .getPublicUrl(filePath);

            uploadedMedia.push({
                id: image.id,
                url: publicUrl,
                legend: image.legend,
                is_visible: image.isVisible,
                rotation: image.rotation,
                ordem: image.ordem,
            });

            toast.success(`Imagem ${image.id} otimizada e enviada.`);
        } catch (err) {
            console.error('Erro no upload otimizado:', err);
            toast.error('Erro ao otimizar/imagem. Verifique o console.');
        }
    }

    return uploadedMedia;
};

/**
 * Faz o upload de mídias de condomínio (imagens/logo) para o Supabase Storage.
 * Aplica otimização + watermark (se houver).
 */
export const uploadCondominioMedia = async (media: CondominioMedia[], userId: string, condominioId: string) => {
    const uploadedMedia: { id: string, url: string, tipo: 'imagem' | 'video', destaque: boolean, ordem: number }[] = [];

    // Fetch watermark url
    let watermarkUrl: string | null = null;
    try {
      const { data } = supabase.storage.from('site-assets').getPublicUrl('watermark.png');
      if (data && data.publicUrl) watermarkUrl = data.publicUrl;
    } catch (e) {
      console.warn('Erro ao obter watermark public url:', e);
      watermarkUrl = null;
    }

    for (const item of media) {
        try {
            if (!item.file) continue;

            // Optimize
            const optimizedBlob = await optimizeImageFile(item.file as File, watermarkUrl);
            const fileExt = (optimizedBlob as Blob).type || 'image/webp';
            const fileName = `${item.id}.${(fileExt.includes('/') ? fileExt.split('/')[1] : 'webp')}`;
            const optimizedFile = new File([optimizedBlob], fileName, { type: (optimizedBlob as Blob).type || 'image/webp' });

            const filePath = `condominios/${condominioId}/${item.id}-${optimizedFile.name}`;

            const { error: uploadError } = await supabase.storage
                .from('condominio-media')
                .upload(filePath, optimizedFile, {
                    cacheControl: '3600',
                    upsert: true,
                    contentType: optimizedFile.type,
                });

            if (uploadError) {
                console.error(`Erro ao fazer upload da mídia ${item.id}:`, uploadError);
                toast.error(`Erro ao enviar mídia ${item.id}: ${uploadError.message}`);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('condominio-media')
                .getPublicUrl(filePath);

            uploadedMedia.push({
                id: item.id,
                url: publicUrl,
                tipo: item.tipo,
                destaque: item.destaque,
                ordem: item.ordem,
            });

            toast.success(`Mídia ${item.id} enviada.`);
        } catch (err) {
            console.error('Erro no upload de condomínio otimizado:', err);
            toast.error('Erro ao otimizar/mídia. Verifique o console.');
        }
    }

    return uploadedMedia;
};

/**
 * Faz o upload de um logo para o Condomínio (utilizado por CondominioForm).
 * Aplica otimização e watermark.
 */
export const uploadCondominioLogo = async (file: File, condominioId: string) => {
    try {
        // Get watermark
        let watermarkUrl: string | null = null;
        try {
          const { data } = supabase.storage.from('site-assets').getPublicUrl('watermark.png');
          if (data && data.publicUrl) watermarkUrl = data.publicUrl;
        } catch (e) {
          watermarkUrl = null;
        }

        const optimizedBlob = await optimizeImageFile(file, watermarkUrl);
        const optimizedFile = new File([optimizedBlob], `logo-${condominioId}.webp`, { type: 'image/webp' });

        const filePath = `condominios/${condominioId}/${optimizedFile.name}`;

        const { error: uploadError } = await supabase.storage
            .from('condominio-media')
            .upload(filePath, optimizedFile, {
                cacheControl: '3600',
                upsert: true,
                contentType: 'image/webp',
            });

        if (uploadError) {
            console.error('Erro ao fazer upload do logo:', uploadError);
            return { url: null, error: uploadError };
        }

        const { data: { publicUrl } } = supabase.storage
            .from('condominio-media')
            .getPublicUrl(filePath);

        return { url: publicUrl, error: null };
    } catch (e) {
        console.error('Erro ao otimizar logo:', e);
        return { url: null, error: e as any };
    }
};