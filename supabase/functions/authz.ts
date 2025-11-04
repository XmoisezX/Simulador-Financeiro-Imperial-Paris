import { serve } from "https://deno.land/std@0.190.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
}

type Mode = "any" | "all"
interface Payload {
  permissions?: string[]
  mode?: Mode
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get("Authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return json({ allowed: false, error: "Unauthorized" }, 401)
    }
    const token = authHeader.replace("Bearer ", "").trim()

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return json({ allowed: false, error: "Server misconfiguration" }, 500)
    }

    const { permissions = [], mode = "any" } = (await req.json().catch(() => ({}))) as Payload
    if (!Array.isArray(permissions) || permissions.length === 0) {
      return json({ allowed: false, error: "permissions array is required" }, 400)
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    })

    let allowed = false
    if (mode === "all") {
      const { data, error } = await supabase.rpc("has_all_permissions", { p_permissions: permissions })
      if (error) return json({ allowed: false, error: error.message }, 400)
      allowed = Boolean(data)
    } else {
      const { data, error } = await supabase.rpc("has_any_permission", { p_permissions: permissions })
      if (error) return json({ allowed: false, error: error.message }, 400)
      allowed = Boolean(data)
    }

    // Opcional: retornar a lista do usuário, útil para depuração/UI
    const { data: grantedList } = await supabase.rpc("get_user_permissions")

    return json({
      allowed,
      mode,
      requested: permissions,
      details: { granted: grantedList || [] }
    })
  } catch (e) {
    console.error("authz error:", e)
    return json({ allowed: false, error: "Unexpected error" }, 500)
  }
})

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  })
}