/**
 * Edge Function: stripe-webhook
 *
 * Handles Stripe webhook events to keep the database in sync.
 * 
 * Supported events:
 *   - checkout.session.completed  → Create subscription record
 *   - invoice.paid               → Renew / confirm recurring payment
 *   - invoice.payment_failed     → Mark subscription as past_due
 *   - customer.subscription.deleted → Mark subscription as cancelled
 *
 * The database trigger `calculate_platform_fee` automatically splits:
 *   - 10% → platform_fee
 *   - 90% → creator_earnings
 *
 * Required secrets:
 *   - STRIPE_SECRET_KEY
 *   - STRIPE_WEBHOOK_SECRET
 *   - SUPABASE_SERVICE_ROLE_KEY (to bypass RLS for inserts)
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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
    const body = await req.text();
    const signature = req.headers.get("stripe-signature");

    if (!signature) {
      return new Response(JSON.stringify({ error: "Missing stripe-signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- TODO: Verify webhook signature ---
    // const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!);
    // const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    // const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    // --- TODO: Use service role client to bypass RLS ---
    // const supabaseAdmin = createClient(
    //   Deno.env.get('SUPABASE_URL')!,
    //   Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    // );

    // --- TODO: Handle events ---
    // switch (event.type) {
    //   case 'checkout.session.completed': {
    //     const session = event.data.object;
    //     const { creatorId, userId } = session.metadata;
    //     const amount = session.amount_total / 100;
    //
    //     // Insert subscription — trigger auto-calculates platform_fee & creator_earnings
    //     await supabaseAdmin.from('subscriptions').insert({
    //       user_id: userId,
    //       creator_id: creatorId,
    //       stripe_subscription_id: session.subscription,
    //       amount,
    //       status: 'active',
    //     });
    //     break;
    //   }
    //
    //   case 'invoice.paid': {
    //     const invoice = event.data.object;
    //     // Update subscription status and amount for renewals
    //     await supabaseAdmin.from('subscriptions')
    //       .update({ status: 'active', amount: invoice.amount_paid / 100 })
    //       .eq('stripe_subscription_id', invoice.subscription);
    //     break;
    //   }
    //
    //   case 'invoice.payment_failed': {
    //     const invoice = event.data.object;
    //     await supabaseAdmin.from('subscriptions')
    //       .update({ status: 'past_due' })
    //       .eq('stripe_subscription_id', invoice.subscription);
    //     break;
    //   }
    //
    //   case 'customer.subscription.deleted': {
    //     const subscription = event.data.object;
    //     await supabaseAdmin.from('subscriptions')
    //       .update({ status: 'cancelled' })
    //       .eq('stripe_subscription_id', subscription.id);
    //     break;
    //   }
    // }

    return new Response(
      JSON.stringify({ received: true, note: "Stripe webhook structure ready — not yet active" }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("stripe-webhook error:", err);
    return new Response(
      JSON.stringify({ error: "Webhook processing failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
