/**
 * Edge Function: create-checkout-session
 *
 * Creates a Stripe Checkout Session for subscribing to a creator.
 * Flow:
 *   1. Authenticate the user via JWT
 *   2. Look up the creator and their Stripe Connect account
 *   3. Create a Stripe Checkout Session with:
 *      - Recurring subscription pricing
 *      - 10% application_fee_percent for platform revenue
 *      - transfer_data pointing to the creator's connected account
 *   4. Return the checkout URL to redirect the user
 *
 * Required secrets:
 *   - STRIPE_SECRET_KEY
 *
 * Request body:
 *   { creatorId: string, priceAmount: number, successUrl: string, cancelUrl: string }
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
    // --- Auth ---
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
    const userId = claimsData.claims.sub;

    // --- Parse body ---
    const { creatorId, priceAmount, successUrl, cancelUrl } = await req.json();

    if (!creatorId || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- Look up creator's Stripe Connect account ---
    const { data: creator, error: creatorError } = await supabase
      .from("creators")
      .select("stripe_account_id, display_name, monthly_price")
      .eq("id", creatorId)
      .single();

    if (creatorError || !creator) {
      return new Response(JSON.stringify({ error: "Creator not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!creator.stripe_account_id) {
      return new Response(
        JSON.stringify({
          error: "Creator has not connected their Stripe account yet",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- TODO: Create Stripe Checkout Session ---
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    //
    // const session = await stripe.checkout.sessions.create({
    //   mode: 'subscription',
    //   payment_method_types: ['card'],
    //   line_items: [{
    //     price_data: {
    //       currency: 'usd',
    //       product_data: { name: `Subscribe to ${creator.display_name}` },
    //       unit_amount: Math.round((priceAmount || creator.monthly_price || 9.99) * 100),
    //       recurring: { interval: 'month' },
    //     },
    //     quantity: 1,
    //   }],
    //   subscription_data: {
    //     application_fee_percent: 10,  // 10% platform fee
    //     transfer_data: {
    //       destination: creator.stripe_account_id,
    //     },
    //     metadata: { creatorId, userId },
    //   },
    //   success_url: successUrl,
    //   cancel_url: cancelUrl,
    //   metadata: { creatorId, userId },
    // });
    //
    // return new Response(JSON.stringify({ url: session.url }), {
    //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    // });

    return new Response(
      JSON.stringify({
        error: "Stripe not configured yet. Structure is ready for integration.",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("create-checkout-session error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
