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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }
    const token = authHeader.replace("Bearer ", "").trim();

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!SUPABASE_URL || !SUPABASE_ANON_KEY || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Missing Supabase environment variables");
      return json({ error: "Server misconfiguration" }, 500);
    }

    // client that uses caller token to check permission via RPC
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // permission check (RPC in DB). We expect the RPC has_permission to exist.
    const { data: permData, error: permError } = await userClient.rpc("has_permission", { p_permission: "gerenciar_usuarios" });

    if (permError) {
      console.error("Permission RPC error:", permError);
      return json({ error: "Falha ao checar permissão" }, 400);
    }

    // Normalize permission RPC return to boolean
    let canManage = false;
    if (typeof permData === "boolean") {
      canManage = permData;
    } else if (Array.isArray(permData) && permData.length > 0) {
      const first = permData[0];
      if (typeof first === "boolean") canManage = first;
      else if (typeof first === "object" && first !== null) {
        canManage = Boolean(first.has_permission ?? first.result ?? first);
      } else {
        canManage = Boolean(first);
      }
    } else if (typeof permData === "object" && permData !== null) {
      canManage = Boolean((permData as any).has_permission ?? (permData as any).result ?? permData);
    } else {
      canManage = Boolean(permData);
    }

    if (!canManage) {
      console.warn("Permission denied for caller when checking has_permission.");
      return json({ error: "Forbidden" }, 403);
    }

    const body = (await req.json().catch(() => ({}))) as Payload;
    const { profile_id, role_id, action } = body;

    if (!profile_id || typeof profile_id !== "string") {
      return json({ error: "profile_id inválido" }, 400);
    }
    if (!role_id || typeof role_id !== "number") {
      return json({ error: "role_id inválido" }, 400);
    }
    if (action !== "add" && action !== "remove") {
      return json({ error: "action inválido (use 'add' ou 'remove')" }, 400);
    }

    // admin client with service role key for privileged writes
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // verify role exists
    const { data: roleInfo, error: roleFetchError } = await adminClient
      .from("roles")
      .select("id, nome")
      .eq("id", role_id)
      .single();

    if (roleFetchError || !roleInfo) {
      console.error("Role fetch error:", roleFetchError);
      return json({ error: "Papel não encontrado." }, 400);
    }

    const now = new Date().toISOString();

    if (action === "add") {
      // Ensure a profiles row exists for this user id (upsert minimal). This fixes the UI mismatch when user_roles exists but profiles row is missing.
      try {
        // upsert ensures the row exists; if profile has more fields they can be filled later
        const { error: upsertProfileErr } = await adminClient
          .from("profiles")
          .upsert({ id: profile_id, updated_at: now }, { onConflict: "id" });

        if (upsertProfileErr) {
          console.warn("Warning: failed to upsert profile row:", upsertProfileErr);
          // continue anyway — absence of profile row shouldn't block role assignment
        }
      } catch (e) {
        console.warn("Unexpected error while upserting profile:", e);
      }

      // Insert or keep existing user_roles relation
      const { error: insertError } = await adminClient
        .from("user_roles")
        .upsert({ user_id: profile_id, role_id }, { onConflict: "user_id,role_id" });

      if (insertError) {
        console.error("Insert user_roles error:", insertError);
        return json({ error: "Falha ao atribuir papel." }, 500);
      }

      // Best-effort: update profiles.role for display convenience
      const { error: updateProfileError } = await adminClient
        .from("profiles")
        .update({ role: roleInfo.nome, updated_at: now })
        .eq("id", profile_id);

      if (updateProfileError) {
        console.warn("Update profile role error (non-fatal):", updateProfileError);
      }

      return json({ message: `Papel ${roleInfo.nome} atribuído com sucesso.` });
    }

    // action === remove
    const { error: deleteError } = await adminClient
      .from("user_roles")
      .delete()
      .match({ user_id: profile_id, role_id });

    if (deleteError) {
      console.error("Delete user_roles error:", deleteError);
      return json({ error: "Falha ao remover papel." }, 500);
    }

    // Try to find another role to set as profile.role (optional convenience)
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
      console.warn("Update profile after removal error (non-fatal):", updateProfileError);
    }

    return json({ message: "Papel removido com sucesso." });
  } catch (err) {
    console.error("Unexpected error in assign-role function:", err);
    return json({ error: "Erro inesperado" }, 500);
  }
});