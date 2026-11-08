const MARKDOWN_IMAGE_RE = /!\[[^\]]*]\((https?:\/\/[^)\s]+|data:image\/[a-zA-Z+]+;base64,[^)\s]+)\)/g;
const BARE_URL_RE =
  /https?:\/\/[^\s"'<>)]+\.(?:png|jpe?g|webp|gif)(?:\?[^\s"'<>)]*)?/gi;
const DATA_URL_RE = /data:image\/[a-zA-Z+]+;base64,[A-Za-z0-9+/=]+/g;

function unique(urls: string[]): string[] {
  return [...new Set(urls)];
}

export function extractImageUrlsFromText(text: string): string[] {
  const found: string[] = [];
  for (const match of text.matchAll(MARKDOWN_IMAGE_RE)) {
    found.push(match[1]);
  }
  for (const match of text.matchAll(DATA_URL_RE)) {
    found.push(match[0]);
  }
  for (const match of text.matchAll(BARE_URL_RE)) {
    found.push(match[0]);
  }
  return unique(found);
}

export function extractImageUrlsFromCompletion(completion: unknown): {
  text: string;
  imageUrls: string[];
} {
  const choice = (completion as {
    choices?: Array<{ message?: { content?: unknown } }>;
  })?.choices?.[0]?.message?.content;

  if (typeof choice === "string") {
    return { text: choice, imageUrls: extractImageUrlsFromText(choice) };
  }

  if (Array.isArray(choice)) {
    const texts: string[] = [];
    const urls: string[] = [];
    for (const part of choice) {
      const p = part as {
        type?: string;
        text?: string;
        image_url?: { url?: string };
      };
      if (p.type === "text" && p.text) {
        texts.push(p.text);
        urls.push(...extractImageUrlsFromText(p.text));
      }
      if (p.type === "image_url" && p.image_url?.url) {
        urls.push(p.image_url.url);
      }
    }
    const text = texts.join("\n").trim();
    return { text, imageUrls: unique(urls) };
  }

  return { text: "", imageUrls: [] };
}
