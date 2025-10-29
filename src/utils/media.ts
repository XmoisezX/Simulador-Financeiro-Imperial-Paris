import { supabase } from '../integrations/supabase/client';
import { ImovelImage } from '../pages/NewImovelPage'; // Importando o tipo de imagem

// Simula a otimização e retorna um novo nome de arquivo (simulando WebP)
const simulateOptimization = (file: File): File => {
    // Em um ambiente real, aqui usaríamos uma biblioteca (Sharp/JIMP) ou um Edge Function
    // para converter o file.file para WebP e retornar um novo File/Blob.
    
    // Para simulação no cliente, apenas renomeamos o arquivo para .webp
    const newName = file.name.replace(/\.[^/.]+$/, "") + '.webp';
    
    // Criamos um novo File com o nome WebP simulado.
    return new File([file], newName, { type: 'image/webp' });
};

/**
 * Faz o upload de uma lista de imagens para o Supabase Storage e retorna os metadados.
 * @param images Lista de objetos ImovelImage.
 * @param userId ID do usuário logado.
 * @param imovelId ID do imóvel recém-criado.
 * @returns Lista de metadados das imagens salvas.
 */
export const uploadImovelMedia = async (images: ImovelImage[], userId: string, imovelId: string) => {
    const uploadedMedia: { id: string, url: string, legend: string, is_visible: boolean, rotation: number }[] = [];

    for (const image of images) {
        // 1. Simular Otimização (WebP)
        const optimizedFile = simulateOptimization(image.file as File); // 'file' não será nulo para novas imagens
        
        // 2. Definir o caminho no Storage
        const filePath = `imoveis/${imovelId}/${image.id}-${optimizedFile.name}`;

        // 3. Upload para o Storage
        const { error: uploadError } = await supabase.storage
            .from('imovel-media')
            .upload(filePath, optimizedFile, {
                cacheControl: '3600',
                upsert: false,
            });

        if (uploadError) {
            console.error(`Erro ao fazer upload da imagem ${image.id}:`, uploadError);
            // Continuamos para a próxima imagem, mas registramos o erro
            continue;
        }

        // 4. Obter URL pública
        const { data: { publicUrl } } = supabase.storage
            .from('imovel-media')
            .getPublicUrl(filePath);
            
        // 5. Adicionar metadados
        uploadedMedia.push({
            id: image.id, // Incluir o ID gerado no cliente
            url: publicUrl,
            legend: image.legend,
            is_visible: image.isVisible,
            rotation: image.rotation,
        });
    }
    
    return uploadedMedia;
};

/**
 * Salva os metadados das mídias na tabela imovel_media.
 */
export const saveMediaMetadata = async (imovelId: string, userId: string, media: { id: string, url: string, legend: string, is_visible: boolean, rotation: number }[]) => {
    if (media.length === 0) return { error: null };
    
    const dataToInsert = media.map(m => ({
        id: m.id, // Usar o ID gerado no cliente
        imovel_id: imovelId,
        user_id: userId,
        url: m.url,
        legend: m.legend,
        is_visible: m.is_visible,
        rotation: m.rotation,
    }));
    
    const { error } = await supabase
        .from('imovel_media')
        .insert(dataToInsert);
        
    return { error };
};