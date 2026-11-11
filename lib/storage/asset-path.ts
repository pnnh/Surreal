import type { AssetType } from "@/lib/db/types";

function folderForAssetType(assetType: AssetType): string {
  if (assetType === "icon") return "icons";
  if (assetType === "svg") return "svg";
  if (assetType === "model") return "models";
  return "images";
}

/**
 * Clean a string so it is safe to use in folder and file names across Windows, macOS, and Linux.
 * Preserves alphanumeric and CJK (Chinese, Japanese, Korean) characters.
 */
export function sanitizeSlug(
  text: string | null | undefined,
  maxLength = 40,
): string {
  if (!text) return "";
  const cleaned = text
    .trim()
    .toLowerCase()
    // Replace forbidden characters on Windows/Linux/macOS and punctuation with spaces
    .replace(/[\\/:*?"<>|\r\n\t`~#%&*{}[\]$!@=^()+;:,.'"]/g, " ")
    .replace(/[，。；！？：“”‘’（）《》【】、—…·]/g, " ")
    // Collapse whitespace to hyphen
    .replace(/\s+/g, "-")
    // Collapse multiple hyphens
    .replace(/-+/g, "-")
    // Strip leading/trailing hyphens
    .replace(/^-+|-+$/g, "");

  if (!cleaned) return "";
  return cleaned.slice(0, maxLength).replace(/-+$/, "");
}

/**
 * Relative key under data/assets/:
 * {conversationId}[-{convSlug}]/{images|icons|svg|models}/{assetId}[-{itemSlug}].{ext}
 */
export function buildAssetStorageKey(input: {
  conversationId: string;
  assetType: AssetType;
  assetId: string;
  ext: string;
  conversationTitle?: string | null;
  description?: string | null;
}): string {
  const folder = folderForAssetType(input.assetType);
  const ext = input.ext.replace(/^\./, "").toLowerCase() || "png";

  const convSlug = sanitizeSlug(input.conversationTitle, 35);
  const convFolder = convSlug
    ? `${input.conversationId}-${convSlug}`
    : input.conversationId;

  const itemSlug = sanitizeSlug(input.description, 40);
  const fileName = itemSlug
    ? `${input.assetId}-${itemSlug}.${ext}`
    : `${input.assetId}.${ext}`;

  return `${convFolder}/${folder}/${fileName}`;
}
