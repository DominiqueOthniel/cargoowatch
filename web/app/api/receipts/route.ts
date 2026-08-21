import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transformShipmentFromDB } from "@/lib/shipments";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .not("receipt", "is", null)
      .order("receipt_uploaded_at", { ascending: false });

    if (error) throw error;

    const receipts = (data || []).map((row) => {
      const s = transformShipmentFromDB(row);
      return {
        trackingId: s.trackingId,
        receipt: s.receipt,
        receiptUploadedAt: s.receiptUploadedAt,
        status: s.status,
        sender: s.sender?.name,
        recipient: s.recipient?.name,
      };
    });

    return NextResponse.json({ receipts });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de lister les reçus" },
      { status: 500 }
    );
  }
}
