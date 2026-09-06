import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { auth } from "./auth";

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

export default http;
