import OpenAI from "openai";
import { getEnv, requirePoeApiKey } from "@/lib/env";
import { sanitizeSvg } from "./sanitize";

const SVG_SYSTEM = `You generate a single production-ready SVG icon for apps/web/UI.

Hard requirements for the SVG markup:
1. Output ONLY the SVG (optional markdown fence). No explanation.
2. Root element MUST be <svg> with a viewBox (e.g. viewBox="0 0 24 24").
3. Icon MUST be monochrome and CSS-colorable: use fill="currentColor" and/or stroke="currentColor". Do NOT hardcode brand colors unless the user explicitly demanded multi-color (then still keep viewBox).
4. Do NOT set fixed pixel width/height on the root that prevent CSS scaling; rely on viewBox.
5. No <script>, no event handlers, no external URLs, no foreignObject.
6. Keep paths simple and centered for toolbar/icon use.`;

export async function generateSvgMarkup(input: {
  prompt: string;
  model?: string;
}): Promise<{ svg: string; model: string }> {
  const env = getEnv();
  if (!env.poeConfigured) {
    throw Object.assign(new Error("POE_API_KEY is not configured"), {
      code: "POE_NOT_CONFIGURED",
    });
  }

  const model = input.model?.trim() || env.agentModel;
  const client = new OpenAI({
    apiKey: requirePoeApiKey(),
    baseURL: env.poeBaseUrl,
  });

  let completion;
  try {
    completion = await client.chat.completions.create({
      model,
      stream: false,
      messages: [
        { role: "system", content: SVG_SYSTEM },
        {
          role: "user",
          content: `Create an SVG icon for:\n${input.prompt.trim()}`,
        },
      ],
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "SVG generation failed";
    throw Object.assign(new Error(message), { code: "POE_UPSTREAM" });
  }

  const content = completion.choices[0]?.message?.content;
  const raw = typeof content === "string" ? content : "";
  const sanitized = sanitizeSvg(raw);
  if (!sanitized.ok) {
    throw Object.assign(new Error(sanitized.reason), { code: "BAD_SVG" });
  }

  return { svg: sanitized.svg, model };
}
