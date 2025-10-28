import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const errorResponse = (message: string, status: number = 500) => {
    return new Response(JSON.stringify({ error: message }), {
        status: status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
};

serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check for Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
        return errorResponse('Unauthorized: Missing Authorization header', 401);
    }

    // Get the form data from the request
    const formData = await req.formData();
    const fileEntry = formData.get('file'); // Get the file by key 'file'

    // Check if a file was provided
    if (!fileEntry || !(fileEntry instanceof File)) {
        return errorResponse("Nenhum arquivo de imagem válido enviado com a chave 'file'.", 400);
    }

    const file = fileEntry as File;

    // Check file size limit (5MB)
    if (file.size > 5 * 1024 * 1024) {
        return errorResponse(`O arquivo ${file.name} excede o limite de 5MB.`, 400);
    }

    // SIMULATION: Return the original image content
    const buffer = await file.arrayBuffer();
    
    return new Response(buffer, {
        status: 200,
        headers: {
            ...corsHeaders,
            'Content-Type': file.type, // Use the file's original content type
            'Content-Disposition': `inline; filename="preview_${file.name}"`,
        },
    });

  } catch (error) {
    console.error("Image Preview Edge Function Error:", error);
    return errorResponse(`Erro interno do servidor: ${error.message}`);
  }
});