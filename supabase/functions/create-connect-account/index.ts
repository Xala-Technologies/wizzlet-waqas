/**
 * Edge Function: create-connect-account
 *
 * Onboards a creator to Stripe Connect (Standard or Express account).
 * Flow:
 *   1. Authenticate the creator
 *   2. Create a Stripe Connect account (or retrieve existing)
 *   3. Save stripe_account_id to the creators table
 *   4. Generate an Account Link for onboarding
 *   5. Return the onboarding URL
 *
 * Required secrets:
 *   - STRIPE_SECRET_KEY
 *
 * Request body:
 *   { returnUrl: string, refreshUrl: string }
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

    const { returnUrl, refreshUrl } = await req.json();

    if (!returnUrl || !refreshUrl) {
      return new Response(
        JSON.stringify({ error: "Missing returnUrl or refreshUrl" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // --- TODO: Create Stripe Connect account ---
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    //
    // // Check if creator already has a Stripe account
    // const { data: creator } = await supabase
    //   .from('creators')
    //   .select('id, stripe_account_id')
    //   .eq('user_id', userId)  // userId from users table lookup
    //   .single();
    //
    // let accountId = creator?.stripe_account_id;
    //
    // if (!accountId) {
    //   const account = await stripe.accounts.create({
    //     type: 'express',  // or 'standard'
    //     capabilities: {
    //       card_payments: { requested: true },
    //       transfers: { requested: true },
    //     },
    //   });
    //   accountId = account.id;
    //
    //   // Save to creators table
    //   await supabase
    //     .from('creators')
    //     .update({ stripe_account_id: accountId })
    //     .eq('id', creator.id);
    // }
    //
    // // Create account onboarding link
    // const accountLink = await stripe.accountLinks.create({
    //   account: accountId,
    //   return_url: returnUrl,
    //   refresh_url: refreshUrl,
    //   type: 'account_onboarding',
    // });
    //
    // return new Response(JSON.stringify({ url: accountLink.url }), {
    //   headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    // });

    return new Response(
      JSON.stringify({
        error: "Stripe Connect not configured yet. Structure is ready.",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("create-connect-account error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
