import { NextResponse } from "next/server";
import { createAdminClient, createClient } from "@/lib/supabase/server";

interface PushPayload {
  userId?: string;
  title?: string;
  body?: string;
  data?: Record<string, unknown>;
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Tidak terautentikasi." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as PushPayload;
    if (!payload.userId || !payload.title || !payload.body) {
      return NextResponse.json(
        { success: false, message: "Parameter userId, title, dan body wajib diisi." },
        { status: 400 }
      );
    }

    const adminClient = createAdminClient();
    const { data: targetProfile, error } = await adminClient
      .from("profiles")
      .select("expo_push_token")
      .eq("id", payload.userId)
      .single();

    if (error || !targetProfile?.expo_push_token) {
      return NextResponse.json({
        success: true,
        skipped: true,
        message: "Pengguna belum memiliki Expo Push Token.",
      });
    }

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Accept-encoding": "gzip, deflate",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        to: targetProfile.expo_push_token,
        sound: "default",
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }),
    });

    const result = await expoResponse.json();
    return NextResponse.json({ success: true, result });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Gagal mengirim notifikasi push.";
    return NextResponse.json({ success: false, message }, { status: 500 });
  }
}
