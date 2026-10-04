import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";
import { resolveSiteUrl } from "./lib/envGuards";

const http = httpRouter();
auth.addHttpRoutes(http);

http.route({
  path: "/stripe/webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const signature = request.headers.get("stripe-signature");
    if (!signature) {
      return new Response("Missing stripe-signature", { status: 400 });
    }
    const payload = await request.text();
    const result = await ctx.runAction(internal.payments.stripeNode.fulfillWebhook, {
      signature,
      payload,
    });
    if (!result.success) {
      return new Response(result.error ?? "Webhook Error", { status: 400 });
    }
    return new Response(null, { status: 200 });
  }),
});

http.route({
  path: "/discord/bot-install/callback",
  method: "GET",
  handler: httpAction(async (ctx, request) => {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const site = resolveSiteUrl();
    const dest = `${site}/creator/integrations`;
    if (!code || !state) {
      return Response.redirect(`${dest}?discord=error`, 302);
    }
    const result = await ctx.runAction(internal.discord.roles.completeBotInstall, {
      code,
      nonce: state,
    });
    if (!result.ok) {
      return Response.redirect(`${dest}?discord=error`, 302);
    }
    return Response.redirect(`${dest}?discord=connected`, 302);
  }),
});

export default http;
