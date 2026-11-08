import { errorFromUnknown, jsonOk } from "@/lib/api/http";
import { getProfile, updateProfile } from "@/lib/db/profile";

export const runtime = "nodejs";

export async function GET() {
  return jsonOk(getProfile());
}

export async function PUT(request: Request) {
  try {
    const body = (await request.json()) as {
      systemPrompt?: string;
      defaultModel?: string;
    };
    const profile = updateProfile({
      systemPrompt: body.systemPrompt,
      defaultModel: body.defaultModel,
    });
    return jsonOk(profile);
  } catch (err) {
    return errorFromUnknown(err);
  }
}
