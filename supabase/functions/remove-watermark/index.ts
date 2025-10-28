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
        const processedName = file.name.replace(/(\.jpe?g|\.png)$/i, '_sem_marca_d_agua$1');
        await zipWriter.add(processedName, new zip.Uint8ArrayReader(file.content));
    }

    const dataURI = await zipWriter.close();
    const base64 = dataURI.split(',')[1];
    return new Uint8Array(atob(base64).split('').map(c => c.charCodeAt(0)));
}

serve(async (req) => {
  // 1. Handle OPTIONS request for CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 2. Authentication Check (Mandatory for Supabase functions)
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return new Response(JSON.stringify({ error: 'Unauthorized: Missing Authorization header' }), {
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
    
    // 3. Process FormData
    const formData = await req.formData();
    const files: { name: string, content: Uint8Array }[] = [];
    
    for (const value of formData.values()) {
        if (value instanceof Blob && 'name' in value) {
            const file = value as File;
            // Check file size limit (5MB = 5 * 1024 * 1024 bytes)
            if (file.size > 5242880) {
                 return new Response(JSON.stringify({ error: `File ${file.name} exceeds the 5MB limit.` }), {
                    status: 400,
                    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                });
            }
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

    // 4. Handle Preview Request
    if (files.length === 1 && req.headers.get('X-Request-Type') === 'preview') {
        const file = files[0];
        
        // SIMULAÇÃO: Retorna a imagem original
        return new Response(file.content, {
            status: 200,
            headers: {
                ...corsHeaders,
                'Content-Type': file.name.endsWith('.png') ? 'image/png' : 'image/jpeg',
                'Content-Disposition': `inline; filename="preview_${file.name}"`,
            },
        });
    }

    // 5. Handle Conversion/Download Request
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
    // Ensure error response includes CORS headers
    return new Response(JSON.stringify({ error: `Erro interno do servidor: ${error.message}` }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});