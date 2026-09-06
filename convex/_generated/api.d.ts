/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin_queries from "../admin/queries.js";
import type * as analytics_mutations from "../analytics/mutations.js";
import type * as auth from "../auth.js";
import type * as bookmarks_mutations from "../bookmarks/mutations.js";
import type * as creators_earnings from "../creators/earnings.js";
import type * as creators_growth from "../creators/growth.js";
import type * as creators_queries from "../creators/queries.js";
import type * as events_queries from "../events/queries.js";
import type * as files_storage from "../files/storage.js";
import type * as http from "../http.js";
import type * as lib_adminLists from "../lib/adminLists.js";
import type * as lib_auth from "../lib/auth.js";
import type * as lib_commerceIdentity from "../lib/commerceIdentity.js";
import type * as lib_credentialOwnership from "../lib/credentialOwnership.js";
import type * as lib_devAdminGrant from "../lib/devAdminGrant.js";
import type * as lib_entitlements from "../lib/entitlements.js";
import type * as lib_money from "../lib/money.js";
import type * as lib_payoutBalance from "../lib/payoutBalance.js";
import type * as lib_results from "../lib/results.js";
import type * as lib_sandbox from "../lib/sandbox.js";
import type * as lib_subscriptions from "../lib/subscriptions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as messaging_mutations from "../messaging/mutations.js";
import type * as migrations_importBatch from "../migrations/importBatch.js";
import type * as migrations_load from "../migrations/load.js";
import type * as notifications_mutations from "../notifications/mutations.js";
import type * as payments_sandbox from "../payments/sandbox.js";
import type * as payments_stripeDb from "../payments/stripeDb.js";
import type * as payments_stripeNode from "../payments/stripeNode.js";
import type * as payouts_mutations from "../payouts/mutations.js";
import type * as picks_mutations from "../picks/mutations.js";
import type * as platform_mutations from "../platform/mutations.js";
import type * as posts_queries from "../posts/queries.js";
import type * as products_mutations from "../products/mutations.js";
import type * as resolution_mutations from "../resolution/mutations.js";
import type * as roles_mutations from "../roles/mutations.js";
import type * as subscriptions_mutations from "../subscriptions/mutations.js";
import type * as support_mutations from "../support/mutations.js";
import type * as users_queries from "../users/queries.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "admin/queries": typeof admin_queries;
  "analytics/mutations": typeof analytics_mutations;
  auth: typeof auth;
  "bookmarks/mutations": typeof bookmarks_mutations;
  "creators/earnings": typeof creators_earnings;
  "creators/growth": typeof creators_growth;
  "creators/queries": typeof creators_queries;
  "events/queries": typeof events_queries;
  "files/storage": typeof files_storage;
  http: typeof http;
  "lib/adminLists": typeof lib_adminLists;
  "lib/auth": typeof lib_auth;
  "lib/commerceIdentity": typeof lib_commerceIdentity;
  "lib/credentialOwnership": typeof lib_credentialOwnership;
  "lib/devAdminGrant": typeof lib_devAdminGrant;
  "lib/entitlements": typeof lib_entitlements;
  "lib/money": typeof lib_money;
  "lib/payoutBalance": typeof lib_payoutBalance;
  "lib/results": typeof lib_results;
  "lib/sandbox": typeof lib_sandbox;
  "lib/subscriptions": typeof lib_subscriptions;
  "lib/validators": typeof lib_validators;
  "messaging/mutations": typeof messaging_mutations;
  "migrations/importBatch": typeof migrations_importBatch;
  "migrations/load": typeof migrations_load;
  "notifications/mutations": typeof notifications_mutations;
  "payments/sandbox": typeof payments_sandbox;
  "payments/stripeDb": typeof payments_stripeDb;
  "payments/stripeNode": typeof payments_stripeNode;
  "payouts/mutations": typeof payouts_mutations;
  "picks/mutations": typeof picks_mutations;
  "platform/mutations": typeof platform_mutations;
  "posts/queries": typeof posts_queries;
  "products/mutations": typeof products_mutations;
  "resolution/mutations": typeof resolution_mutations;
  "roles/mutations": typeof roles_mutations;
  "subscriptions/mutations": typeof subscriptions_mutations;
  "support/mutations": typeof support_mutations;
  "users/queries": typeof users_queries;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
