/**
 * Edge Function: sandbox-checkout
 *
 * Simulated (sandbox) checkout used for demos while no live payment
 * provider is connected. It authenticates the caller, resolves the creator
 * and price, and writes a real `subscriptions` row so the rest of the
 * product (fees, earnings, access gating, admin finance) behaves exactly
 * like production. No money moves and no Stripe keys are required.
 *
 * Actions:
 *   - subscribe: create/reactivate a sandbox subscription
 *   - cancel:    cancel an existing sandbox subscription
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Explicit allow-list: never mint free premium subscriptions in production
    // unless operators intentionally enable sandbox checkout.
    if (Deno.env.get("ALLOW_SANDBOX_CHECKOUT") !== "true") {
      return json({ error: "Sandbox checkout is disabled" }, 403);
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await anon.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return json({ error: "Unauthorized" }, 401);
    }
    const authId = claimsData.claims.sub as string;

    const body = await req.json().catch(() => ({}));
    const action: string = body?.action ?? "subscribe";
    const creatorId: string | undefined = body?.creatorId;
    const productId: string | undefined = body?.productId;

    if (!creatorId || typeof creatorId !== "string") {
      return json({ error: "creatorId is required" }, 400);
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: appUser, error: userError } = await admin
      .from("users")
      .select("id")
      .eq("auth_id", authId)
      .maybeSingle();

    if (userError || !appUser) {
      return json({ error: "User profile not found" }, 404);
    }

    const { data: creator, error: creatorError } = await admin
      .from("creators")
      .select("id, display_name, monthly_price")
      .eq("id", creatorId)
      .maybeSingle();

    if (creatorError || !creator) {
      return json({ error: "Creator not found" }, 404);
    }

    const { data: existing } = await admin
      .from("subscriptions")
      .select("id, status")
      .eq("user_id", appUser.id)
      .eq("creator_id", creator.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (action === "cancel") {
      if (!existing) return json({ error: "No subscription found" }, 404);
      const { error } = await admin
        .from("subscriptions")
        .update({ status: "cancelled" })
        .eq("id", existing.id);
      if (error) {
        console.error("sandbox-checkout cancel error:", error);
        return json({ error: "Could not cancel subscription" }, 400);
      }
      return json({ ok: true, status: "cancelled", sandbox: true });
    }

    if (action !== "subscribe") {
      return json({ error: "Unsupported action" }, 400);
    }

    // Resolve the price: explicit product > creator default > fallback
    let amount = Number(creator.monthly_price ?? 9.99);
    if (productId) {
      const { data: product } = await admin
        .from("products")
        .select("price, is_active, creator_id")
        .eq("id", productId)
        .maybeSingle();
      if (!product || product.creator_id !== creator.id || !product.is_active) {
        return json({ error: "Product unavailable" }, 400);
      }
      amount = Number(product.price);
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return json({ error: "This creator has not set a price yet" }, 400);
    }

    if (existing?.status === "active") {
      return json({ ok: true, status: "active", alreadySubscribed: true, sandbox: true });
    }

    const sandboxRef = `sandbox_${crypto.randomUUID()}`;

    if (existing) {
      const { error } = await admin
        .from("subscriptions")
        .update({
          status: "active",
          amount,
          stripe_subscription_id: sandboxRef,
        })
        .eq("id", existing.id);
      if (error) {
        console.error("sandbox-checkout update error:", error);
        return json({ error: "Could not update subscription" }, 400);
      }
    } else {
      const { error } = await admin.from("subscriptions").insert({
        user_id: appUser.id,
        creator_id: creator.id,
        amount,
        status: "active",
        stripe_subscription_id: sandboxRef,
      });
      if (error) {
        console.error("sandbox-checkout insert error:", error);
        return json({ error: "Could not create subscription" }, 400);
      }
    }

    await admin.from("notifications").insert({
      user_id: appUser.id,
      type: "subscription",
      title: `Subscribed to ${creator.display_name ?? "creator"}`,
      description: `Sandbox payment of $${amount.toFixed(2)} — no real charge was made.`,
      link: "/dashboard/subscriptions-billing",
    });

    return json({ ok: true, status: "active", amount, sandbox: true, reference: sandboxRef });
  } catch (err) {
    console.error("sandbox-checkout error:", err);
    return json({ error: "Internal server error" }, 500);
  }
});
