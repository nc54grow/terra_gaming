import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: adminRecord } = await adminClient
      .from("tg_admins")
      .select("id")
      .eq("id", user.id)
      .maybeSingle();

    if (!adminRecord) {
      return new Response(JSON.stringify({ error: "Forbidden — admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const path = url.pathname.replace("/admin-orgs", "");
    const method = req.method;

    // ============================================================
    // ORGANIZATIONS
    // ============================================================

    if (method === "GET" && (path === "" || path === "/")) {
      const [orgRes, adminRes] = await Promise.all([
        adminClient.from("tg_organizations").select("*").order("created_at", { ascending: false }),
        adminClient.from("tg_admins").select("*").order("created_at", { ascending: false }),
      ]);

      if (orgRes.error) throw orgRes.error;
      if (adminRes.error) throw adminRes.error;
      return new Response(JSON.stringify({ organizations: orgRes.data, admins: adminRes.data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "POST" && (path === "" || path === "/")) {
      const body = await req.json();
      const { email, password, name, description } = body;

      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: "Missing required fields: email, password, name" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) throw authError;

      const { data: orgData, error: orgError } = await adminClient
        .from("tg_organizations")
        .insert({
          id: authData.user.id,
          email,
          name,
          description: description || null,
          status: "active",
        })
        .select("*")
        .single();

      if (orgError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw orgError;
      }

      return new Response(JSON.stringify({ organization: orgData }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "PUT" && path.startsWith("/")) {
      const orgId = path.slice(1);
      const body = await req.json();
      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };

      if (body.name !== undefined) updates.name = body.name;
      if (body.description !== undefined) updates.description = body.description;
      if (body.status !== undefined) updates.status = body.status;
      if (body.logo_url !== undefined) updates.logo_url = body.logo_url;

      const { data, error } = await adminClient
        .from("tg_organizations")
        .update(updates)
        .eq("id", orgId)
        .select("*")
        .single();

      if (error) throw error;
      return new Response(JSON.stringify({ organization: data }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE" && path.startsWith("/")) {
      const orgId = path.slice(1);

      const { data: org } = await adminClient
        .from("tg_organizations")
        .select("id")
        .eq("id", orgId)
        .maybeSingle();

      if (!org) {
        return new Response(JSON.stringify({ error: "Organization not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.auth.admin.deleteUser(orgId);
      await adminClient.from("tg_organizations").delete().eq("id", orgId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============================================================
    // ADMINS
    // ============================================================

    if (method === "POST" && path === "/admins") {
      const body = await req.json();
      const { email, password, display_name } = body;

      if (!email || !password) {
        return new Response(JSON.stringify({ error: "Missing required fields: email, password" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: authData, error: authError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (authError) throw authError;

      const { data: adminData, error: adminError } = await adminClient
        .from("tg_admins")
        .insert({
          id: authData.user.id,
          email,
          display_name: display_name || null,
        })
        .select("*")
        .single();

      if (adminError) {
        await adminClient.auth.admin.deleteUser(authData.user.id);
        throw adminError;
      }

      return new Response(JSON.stringify({ admin: adminData }), {
        status: 201,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (method === "DELETE" && path.startsWith("/admins/")) {
      const adminId = path.replace("/admins/", "");

      if (adminId === user.id) {
        return new Response(JSON.stringify({ error: "You cannot delete your own admin account" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { data: admin } = await adminClient
        .from("tg_admins")
        .select("id")
        .eq("id", adminId)
        .maybeSingle();

      if (!admin) {
        return new Response(JSON.stringify({ error: "Admin not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      await adminClient.auth.admin.deleteUser(adminId);
      await adminClient.from("tg_admins").delete().eq("id", adminId);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
