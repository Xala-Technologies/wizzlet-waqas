/**
 * Edge Function: stripe-webhook
 *
 * Handles Stripe webhook events to keep the database in sync.
 *
 * FAIL CLOSED: until Stripe signature verification is implemented with
 * `constructEvent`, this function refuses to process payloads. Returning 200
 * without verification would allow forged events to mutate subscriptions.
 *
 * Required secrets (when activating):
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - SUPABASE_SERVICE_ROLE_KEY
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const signature = req.headers.get("stripe-signature");
    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      return new Response(
        JSON.stringify({ error: "Webhook not configured" }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // Consume body so the request is fully read, but do not trust it.
    await req.text();

    // Signature verification (constructEvent) is not yet wired. Refuse all
    // processing so unverified events cannot create or cancel subscriptions.
    return new Response(
      JSON.stringify({
        error:
          "Webhook signature verification is not implemented — refusing to process events",
      }),
      {
        status: 501,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
