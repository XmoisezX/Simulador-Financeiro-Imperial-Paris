import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const token = authHeader.replace("Bearer ", "");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client com token do usuário para checar permissão via RLS/RPC
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });

    // Verifica permissão
    const { data: can, error: permError } = await userClient.rpc("has_permission", { p_permission: "gerenciar_usuarios" });
    if (permError) {
      console.error("Permission check error:", permError);
      return new Response(JSON.stringify({ error: "Falha ao checar permissão" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!can) {
      return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json();
    const email = String(body?.email || "").trim();
    const full_name = String(body?.full_name || "").trim();
    const roles: string[] = Array.isArray(body?.roles) ? body.roles : [];

    if (!email || !full_name) {
      return new Response(JSON.stringify({ error: "email e full_name são obrigatórios" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Client com Service Role para criar usuários e manipular perfis
    const adminClient = createClient(supabaseUrl, serviceKey);

    // Cria usuário (sem senha; você pode alterar para definir senha ou enviar convite)
    const { data: created, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      email_confirm: false, // O usuário confirmará via link recebido no e-mail (se configurado)
      user_metadata: { full_name },
    });

    if (createErr || !created?.user) {
      console.error("Create user error:", createErr);
      return new Response(JSON.stringify({ error: createErr?.message || "Falha ao criar usuário" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const newUserId = created.user.id;

    // Garante profile (caso trigger não esteja ativo)
    const { error: upsertProfErr } = await adminClient
      .from("profiles")
      .upsert({ id: newUserId, full_name, email, updated_at: new Date().toISOString() });

    if (upsertProfErr) {
      console.error("Upsert profile error:", upsertProfErr);
    }

    // Atribui papéis, se enviados
    if (roles.length > 0) {
      const { data: roleRows, error: roleErr } = await adminClient
        .from("roles")
        .select("id,nome")
        .in("nome", roles);

      if (roleErr) {
        console.error("Fetch roles error:", roleErr);
      } else if (roleRows && roleRows.length > 0) {
        const inserts = roleRows.map((r: any) => ({ user_id: newUserId, role_id: r.id }));
        const { error: urErr } = await adminClient.from("user_roles").insert(inserts);
        if (urErr) console.error("Insert user_roles error:", urErr);

        // Reflete primeiro papel no profiles.role para exibição
        const firstRole = roleRows[0]?.nome;
        if (firstRole) {
          const { error: updRoleErr } = await adminClient
            .from("profiles")
            .update({ role: firstRole, updated_at: new Date().toISOString() })
            .eq("id", newUserId);
          if (updRoleErr) console.error("Update profile role error:", updRoleErr);
        }
      }
    }

    return new Response(JSON.stringify({ id: newUserId, email }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("Unexpected error:", e);
    return new Response(JSON.stringify({ error: "Erro inesperado" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});