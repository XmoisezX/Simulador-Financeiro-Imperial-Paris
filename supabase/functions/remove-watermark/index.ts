import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { zip } from "https://deno.land/x/zipjs@v2.7.18/index.js";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, content-disposition',
};

// Função auxiliar para criar um arquivo ZIP simulado
async function createSimulatedZip(files: { name: string, content: Uint8Array }[]): Promise<Uint8Array> {
    const zipWriter = new zip.ZipWriter(new zip.Data64URIWriter());
    
    for (const file of files) {
        // Simula o processamento: apenas renomeia o arquivo
        const processedName = file.name.replace(/(\.jpe?g|\.png)$/i, '_sem_marca_d_agua$1');
        
        // Em um cenário real, 'file.content' seria a imagem processada.
        // Aqui, usamos o conteúdo original para simular o arquivo no ZIP.
        await zipWriter.add(processedName, new zip.Uint8ArrayReader(file.content));
    }

    const dataURI = await zipWriter.close();
    // Converte Data URI para Uint8Array
    const base64 = dataURI.split(',')[1];
    return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // O req.formData() lida com o Content-Type: multipart/form-data
    const formData = await req.formData();
    const files: { name: string, content: Uint8Array }[] = [];
    
    // Coleta todos os arquivos do FormData, independentemente do nome do campo ('file' ou 'files')
    for (const value of formData.values()) {
        // Verifica se o valor é um objeto File (Blob com nome)
        if (value instanceof Blob && 'name' in value) {
            const file = value as File;
            const buffer = await file.arrayBuffer();
            files.push({
                name: file.name,
                content: new Uint8Array(buffer)
            });
        }
    }

    if (files.length === 0) {
        return new Response(JSON.stringify({ error: "Nenhum arquivo de imagem válido enviado." }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }

    // 1. Gerar Preview (requer exatamente 1 arquivo e header 'X-Request-Type: preview')
    if (files.length === 1 && req.headers.get('X-Request-Type') === 'preview') {
        const file = files[0];
        
        // SIMULAÇÃO: Retorna a imagem original como se fosse a processada
        return new Response(file.content, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': file.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
                'Content-Disposition': `inline; filename="preview_${file.name}"`,
            },
        });
    }

    // 2. Conversão Final (múltiplos ou único arquivo)
    const zipContent = await createSimulatedZip(files);

    return new Response(zipContent, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename="imagens_sem_marca_d_agua.zip"',
      },
    });

  } catch (error) {
    console.error("Edge Function Error:", error);
    // Retorna um erro 500 com detalhes
    return new Response(JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});