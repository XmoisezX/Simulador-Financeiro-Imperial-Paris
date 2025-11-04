import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};

type Action = "add" | "remove";

interface Payload {
  profile_id?: string;
  role_id?: number;
  action?: Action;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return jsonResponse({ error: "Server misconfiguration" }, 500);
    }

    // Client that uses the caller's token to run the permission check RPC
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    // Call the has_permission RPC. It may return boolean or an array/object depending on SQL.
    const { data: permData, error: permError } = await userClient.rpc("has_permission", { p_permission: "gerenciar_usuarios" });

    if (permError) {
      console.error("Permission RPC error:", permError);
      return jsonResponse({ error: "Falha ao checar permissão" }, 500);
    }

    // Normalize various possible return shapes into a boolean
    let canManage = false;
    if (typeof permData === "boolean") {
      canManage = permData;
    } else if (Array.isArray(permData) && permData.length > 0) {
      // could be [ true ] or [ { has_permission: true } ]
      const first = permData[0];
      if (typeof first === "boolean") canManage = first;
      else if (typeof first === "object" && first !== null) {
        // try common patterns
        canManage = Boolean(first.has_permission ?? first.result ?? first);
      } else {
        canManage = Boolean(first);
      }
    } else if (typeof permData === "object" && permData !== null) {
      // e.g., { has_permission: true } or similar
      canManage = Boolean((permData as any).has_permission ?? (permData as any).result ?? permData);
    } else {
      canManage = Boolean(permData);
    }

    if (!canManage) {
      console.warn("Permission denied for caller when checking has_permission.");
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Payload;
    const { profile_id, role_id, action } = body;

    if (!profile_id || typeof profile_id !== "string") {
      return jsonResponse({ error: "profile_id inválido" }, 400);
    }
    if (!role_id || typeof role_id !== "number") {
      return jsonResponse({ error: "role_id inválido" }, 400);
    }
    if (action !== "add" && action !== "remove") {
      return jsonResponse({ error: "action inválido (use 'add' ou 'remove')" }, 400);
    }

    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: roleInfo, error: roleFetchError } = await adminClient
      .from("roles")
      .select("id, nome")
      .eq("id", role_id)
      .single();

    if (roleFetchError || !roleInfo) {
      console.error("Role fetch error:", roleFetchError);
      return jsonResponse({ error: "Papel não encontrado." }, 400);
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Upsert user_roles relationship
      const { error: insertError } = await adminClient
        .from("user_roles")
        .upsert({ user_id: profile_id, role_id }, { onConflict: "user_id,role_id" });

      if (insertError) {
        console.error("Insert user_roles error:", insertError);
        return jsonResponse({ error: "Falha ao atribuir papel." }, 500);
      }

      // Update profile.role for display (best-effort)
      const { error: updateProfileError } = await adminClient
        .from("profiles")
        .update({ role: roleInfo.nome, updated_at: now })
        .eq("id", profile_id);

      if (updateProfileError) {
        console.error("Update profile role error:", updateProfileError);
      }

      return jsonResponse({ message: `Papel ${roleInfo.nome} atribuído com sucesso.` });
    }

    // REMOVE path
    const { error: deleteError } = await adminClient
      .from("user_roles")
      .delete()
      .match({ user_id: profile_id, role_id });

    if (deleteError) {
      console.error("Delete user_roles error:", deleteError);
      return jsonResponse({ error: "Falha ao remover papel." }, 500);
    }

    // Try to find another role to set as profile.role (optional)
    const { data: remainingRoles, error: remainingError } = await adminClient
      .from("user_roles")
      .select(`
        role_id,
        roles:role_id ( nome )
      `)
      .eq("user_id", profile_id)
      .limit(1);

    if (remainingError) {
      console.error("Fetch remaining roles error:", remainingError);
    }

    let nextRoleName: string | null = null;
    if (Array.isArray(remainingRoles) && remainingRoles.length > 0) {
      nextRoleName = remainingRoles[0]?.roles?.nome ?? null;
    }

    const { error: updateProfileError } = await adminClient
      .from("profiles")
      .update({ role: nextRoleName, updated_at: now })
      .eq("id", profile_id);

    if (updateProfileError) {
      console.error("Update profile after removal error:", updateProfileError);
    }

    return jsonResponse({ message: "Papel removido com sucesso." });
  } catch (error) {
    console.error("Unexpected error in assign-role function:", error);
    return jsonResponse({ error: "Erro inesperado" }, 500);
  }
});

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}