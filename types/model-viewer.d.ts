import * as React from "react";

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "model-viewer": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          poster?: string;
          loading?: "auto" | "lazy" | "eager";
          reveal?: "auto" | "interaction" | "manual";
          "camera-controls"?: boolean;
          "auto-rotate"?: boolean;
          "auto-rotate-delay"?: number;
          "rotation-per-second"?: string;
          "camera-orbit"?: string;
          "field-of-view"?: string;
          "shadow-intensity"?: string | number;
          "shadow-softness"?: string | number;
          exposure?: string | number;
          environment_image?: string;
          skybox_image?: string;
          ar?: boolean;
          "ar-modes"?: string;
          "interaction-prompt"?: "auto" | "when-focused" | "none";
          "interaction-prompt-style"?: "wiggle" | "basic";
        },
        HTMLElement
      >;
    }
  }
}

declare global {
  namespace JSX {
    interface IntrinsicElements {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      "model-viewer": any;
    }
  }
}

export {};
