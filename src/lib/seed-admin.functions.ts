import { createServerFn } from "@tanstack/react-start";

const ADMIN_EMAIL = "g.sagar9550@gmail.com";
const ADMIN_PASSWORD = "vinod@123";

export const ensureDefaultAdmin = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  // Look for existing user by paginating list (small user base)
  let existingId: string | null = null;
  let page = 1;
  for (;;) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase());
    if (found) { existingId = found.id; break; }
    if (data.users.length < 200) break;
    page++;
  }

  let userId = existingId;
  if (!userId) {
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      email_confirm: true,
    });
    if (error) throw error;
    userId = data.user.id;
  }

  // Ensure admin role
  const { data: roles } = await supabaseAdmin
    .from("user_roles")
    .select("id")
    .eq("user_id", userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!roles) {
    await supabaseAdmin.from("user_roles").insert({ user_id: userId, role: "admin" });
  }

  return { ok: true };
});
