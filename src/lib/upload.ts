/**
 * Upload a file to Convex storage and return a public URL.
 * Must register ownership before resolving the URL (see `files.storage.getUrl`).
 */
import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

export async function uploadToConvexStorage(
  client: ConvexReactClient,
  file: File,
  purpose = "image",
): Promise<string> {
  const contentType = file.type || "application/octet-stream";
  if (file.type && !ALLOWED_IMAGE_TYPES.has(file.type) && purpose === "image") {
    throw new Error("Use a JPG, PNG, or WebP image");
  }

  const uploadUrl = await client.mutation(api.files.storage.generateUploadUrl, {});
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": contentType },
    body: file,
  });
  if (!result.ok) {
    const detail = await result.text().catch(() => "");
    throw new Error(
      detail
        ? `Upload failed (${result.status}): ${detail.slice(0, 120)}`
        : `Upload failed (${result.status})`,
    );
  }

  const body = (await result.json()) as { storageId?: Id<"_storage"> };
  if (!body.storageId) {
    throw new Error("Upload failed: missing storage id");
  }

  // Ownership must be registered before getUrl will resolve (auth gate).
  await client.mutation(api.files.storage.registerOwnedFile, {
    storageId: body.storageId,
    purpose,
  });

  const url = await client.query(api.files.storage.getUrl, {
    storageId: body.storageId,
  });
  if (!url) throw new Error("Failed to resolve file URL");
  return url;
}
