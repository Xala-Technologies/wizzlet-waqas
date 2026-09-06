/**
 * Upload a file to Convex storage. Returns a public URL.
 */
import { ConvexReactClient } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";

export async function uploadToConvexStorage(
  client: ConvexReactClient,
  file: File,
): Promise<string> {
  const uploadUrl = await client.mutation(api.files.storage.generateUploadUrl, {});
  const result = await fetch(uploadUrl, {
    method: "POST",
    headers: { "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  if (!result.ok) {
    throw new Error(`Upload failed (${result.status})`);
  }
  const { storageId } = (await result.json()) as { storageId: Id<"_storage"> };
  const url = await client.query(api.files.storage.getUrl, { storageId });
  if (!url) throw new Error("Failed to resolve file URL");
  return url;
}
