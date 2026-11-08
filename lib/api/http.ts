import { NextResponse } from "next/server";

export function jsonOk<T>(data: T, init?: { status?: number }) {
  return NextResponse.json(data, { status: init?.status ?? 200 });
}

export function jsonError(
  code: string,
  message: string,
  status = 400,
) {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function errorFromUnknown(err: unknown) {
  const e = err as {
    code?: string;
    message?: string;
    userMessage?: unknown;
    assistantMessage?: unknown;
    assets?: unknown;
  };
  const code = e.code || "INTERNAL";
  const message = e.message || "Unexpected error";
  const status =
    code === "NOT_FOUND"
      ? 404
      : code === "BUSY"
        ? 409
        : code === "POE_NOT_CONFIGURED" ||
            code === "BAD_REQUEST" ||
            code === "NO_IMAGE" ||
            code === "EMPTY_OPTIMIZATION"
          ? 400
          : code === "POE_UPSTREAM"
            ? 502
            : 500;

  if (code === "NO_IMAGE") {
    return NextResponse.json(
      {
        error: { code, message },
        userMessage: e.userMessage,
        assistantMessage: e.assistantMessage,
        assets: e.assets ?? [],
      },
      { status },
    );
  }

  return jsonError(code, message, status);
}
