export type SanitizeSvgResult =
  | {
      ok: true;
      svg: string;
      hasViewBox: true;
      usesCurrentColor: boolean;
    }
  | { ok: false; reason: string };

const DANGEROUS =
  /<script[\s>/]|javascript:|xlink:href\s*=\s*["'](?!#)|href\s*=\s*["']https?:|onload\s*=|onerror\s*=|<foreignObject/i;

/** Strip markdown fences and extract the first <svg>…</svg> block. */
export function extractSvgMarkup(raw: string): string | null {
  let text = raw.trim();
  const fenced = text.match(/```(?:svg|xml|html)?\s*([\s\S]*?)```/i);
  if (fenced?.[1]) text = fenced[1].trim();

  const start = text.search(/<svg\b/i);
  if (start < 0) return null;
  const end = text.toLowerCase().lastIndexOf("</svg>");
  if (end < 0) return null;
  return text.slice(start, end + "</svg>".length).trim();
}

function ensureCurrentColor(svg: string): { svg: string; usesCurrentColor: boolean } {
  if (/currentColor/i.test(svg)) {
    return { svg, usesCurrentColor: true };
  }

  // Prefer rewriting common hardcoded fills/strokes on shapes (not none/url()).
  let rewritten = svg.replace(
    /\b(fill|stroke)\s*=\s*["'](?!none|url\(|currentColor)([^"']+)["']/gi,
    '$1="currentColor"',
  );

  if (!/currentColor/i.test(rewritten)) {
    // Inject fill on root svg if still no paint hint.
    rewritten = rewritten.replace(
      /<svg\b([^>]*)>/i,
      (full, attrs: string) => {
        if (/\bfill\s*=/i.test(attrs)) {
          return full.replace(/\bfill\s*=\s*["'][^"']*["']/i, 'fill="currentColor"');
        }
        return `<svg${attrs} fill="currentColor">`;
      },
    );
  }

  return {
    svg: rewritten,
    usesCurrentColor: /currentColor/i.test(rewritten),
  };
}

export function sanitizeSvg(raw: string): SanitizeSvgResult {
  const extracted = extractSvgMarkup(raw);
  if (!extracted) {
    return { ok: false, reason: "No <svg> root element found in model output" };
  }

  if (DANGEROUS.test(extracted)) {
    return {
      ok: false,
      reason: "SVG rejected: contains script, event handlers, or external links",
    };
  }

  if (!/\bviewBox\s*=/i.test(extracted)) {
    return { ok: false, reason: "SVG must include a viewBox attribute" };
  }

  const { svg, usesCurrentColor } = ensureCurrentColor(extracted);
  if (!usesCurrentColor) {
    return {
      ok: false,
      reason: "SVG must use currentColor (or rewritable fills) for CSS coloring",
    };
  }

  // Soften fixed pixel width/height on root so CSS can scale (keep viewBox).
  const scaled = svg.replace(/<svg\b([^>]*)>/i, (_full, attrs: string) => {
    const next = attrs
      .replace(/\bwidth\s*=\s*["'][^"']*["']/gi, "")
      .replace(/\bheight\s*=\s*["'][^"']*["']/gi, "");
    return `<svg${next}>`;
  });

  return {
    ok: true,
    svg: scaled,
    hasViewBox: true,
    usesCurrentColor: true,
  };
}
