"use client";

import { useEffect, useRef, useState } from "react";
import { useI18n } from "@/lib/i18n/LocaleProvider";

const ModelViewerElement = "model-viewer" as unknown as React.ElementType;

type ModelViewerProps = {
  src: string;
  alt?: string;
  prompt?: string;
  category?: string;
  styleName?: string;
  className?: string;
};

export function ModelViewer({
  src,
  alt = "3D Model",
  prompt,
  category,
  styleName,
  className = "",
}: ModelViewerProps) {
  const { t } = useI18n();
  const [loaded, setLoaded] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [autoRotate, setAutoRotate] = useState(true);
  const [scriptReady, setScriptReady] = useState(false);
  const viewerRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (customElements.get("model-viewer")) {
      setScriptReady(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src =
      "https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js";
    script.onload = () => setScriptReady(true);
    script.onerror = () => {
      // If CDN fails, still allow downloading
      setLoadError(true);
    };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer) return;

    const handleLoad = () => setLoaded(true);
    const handleError = () => setLoadError(true);

    viewer.addEventListener("load", handleLoad);
    viewer.addEventListener("error", handleError);

    return () => {
      viewer.removeEventListener("load", handleLoad);
      viewer.removeEventListener("error", handleError);
    };
  }, [scriptReady]);

  return (
    <div
      className={`relative flex flex-col rounded-xl overflow-hidden border border-zinc-700/60 bg-zinc-950/80 shadow-lg ${className}`}
    >
      {/* Top Controls & Meta */}
      <div className="flex items-center justify-between px-3 py-2 bg-zinc-900/80 border-b border-zinc-800 text-xs">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-md">
            3D GLB
          </span>
          {category && (
            <span className="text-zinc-300 bg-zinc-800 px-2 py-0.5 rounded-md">
              {category}
            </span>
          )}
          {styleName && (
            <span className="text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-md">
              {styleName}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setAutoRotate((prev) => !prev)}
            className={`px-2 py-0.5 rounded text-xs transition cursor-pointer ${
              autoRotate
                ? "bg-emerald-600/30 text-emerald-300 border border-emerald-600/50"
                : "bg-zinc-800 text-zinc-400 hover:text-zinc-200"
            }`}
            title="Toggle auto rotation"
          >
            {autoRotate ? "Auto-Rotate ON" : "Auto-Rotate OFF"}
          </button>

          <a
            href={src}
            download={`${alt.replace(/[^a-zA-Z0-9_-]/g, "_") || "model"}.glb`}
            className="flex items-center gap-1 px-2.5 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition text-xs font-medium"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
              />
            </svg>
            {t.chat.modelDownload}
          </a>
        </div>
      </div>

      {/* 3D Viewport */}
      <div className="relative w-full h-[320px] sm:h-[380px] bg-gradient-to-b from-zinc-900 to-zinc-950 flex items-center justify-center">
        {(!scriptReady || !loaded) && !loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-zinc-400 text-xs z-10 pointer-events-none bg-zinc-950/40 backdrop-blur-xs">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span>{t.chat.modelLoading}</span>
          </div>
        )}

        {loadError && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-zinc-400 p-4 text-center">
            <span className="text-amber-400 font-medium">
              {t.chat.modelLoadFailed}
            </span>
            <p className="text-xs text-zinc-500 max-w-sm">
              The 3D viewer could not be initialized. You can still download the
              .glb file directly and view it in Blender or any 3D tool.
            </p>
            <a
              href={src}
              download={`${alt || "model"}.glb`}
              className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition"
            >
              {t.chat.modelDownload}
            </a>
          </div>
        )}

        {scriptReady && !loadError && (
          <ModelViewerElement
            ref={viewerRef}
            src={src}
            alt={alt}
            camera-controls=""
            auto-rotate={autoRotate ? "" : undefined}
            shadow-intensity="1"
            shadow-softness="0.5"
            exposure="1"
            loading="lazy"
            style={{ width: "100%", height: "100%", outline: "none" }}
          />
        )}

        {/* Orbit hint pill */}
        <div className="absolute bottom-2 left-2 z-10 pointer-events-none px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs text-[10px] text-zinc-400 border border-zinc-800">
          {t.chat.modelRotateHelp}
        </div>
      </div>

      {/* Prompt Footer if present */}
      {prompt && (
        <div className="px-3 py-1.5 bg-zinc-900/60 border-t border-zinc-800/80 text-[11px] text-zinc-400 truncate">
          <span className="text-zinc-500 mr-1.5 font-mono">PROMPT:</span>
          {prompt}
        </div>
      )}
    </div>
  );
}

