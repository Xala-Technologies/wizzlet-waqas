/**
 * Edge Function: create-customer-portal
 *
 * Creates a Stripe Customer Portal session so subscribers can
 * manage billing, cancel, or update payment methods.
 *
 * Required secrets:
 *   - STRIPE_SECRET_KEY
 *
 * Request body:
 *   { returnUrl: string }
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } =
      await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { returnUrl } = await req.json();

    // --- TODO: Create portal session ---
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    //
    // // Look up Stripe customer ID from user's subscriptions or a customers table
    // const session = await stripe.billingPortal.sessions.create({
    //   customer: stripeCustomerId,
    //   return_url: returnUrl,
    // });
    //
    // return new Response(JSON.stringify({ url: session.url }), {
    //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    // });

    return new Response(
      JSON.stringify({
        error: "Customer portal not configured yet. Structure is ready.",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("create-customer-portal error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
