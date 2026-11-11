import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const user = await getSessionUser(req);

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Sesi tidak ditemukan atau telah kedaluwarsa." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        namaLengkap: user.namaLengkap,
        role: user.role,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
