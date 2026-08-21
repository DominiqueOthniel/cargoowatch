import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { transformShipmentFromDB, transformShipmentToDB } from "@/lib/shipments";
import { calculateAutomaticProgression } from "@/lib/auto-progress";
import { buildStatusEvent, statusFromProgress } from "@/lib/shipment-status";

export async function GET(request: Request) {
  return runCron(request);
}

export async function POST(request: Request) {
  return runCron(request);
}

async function runCron(request: Request) {
  const auth = request.headers.get("authorization") || "";
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase.from("shipments").select("*");
    if (error) throw error;

    let updated = 0;
    for (const row of data || []) {
      const shipment = transformShipmentFromDB(row);
      if (
        !shipment.autoProgress?.enabled ||
        shipment.autoProgress?.paused ||
        shipment.status === "delivered" ||
        shipment.status === "pending" ||
        shipment.status === "exception"
      ) {
        continue;
      }

      if (!shipment.autoProgress.startedAt) {
        shipment.autoProgress.startedAt = new Date().toISOString();
      }

      const autoPos = await calculateAutomaticProgression(shipment);
      if (!autoPos) continue;

      const nextStatus = statusFromProgress(autoPos.progress, shipment.status);
      const statusChanged = nextStatus !== shipment.status;
      const events = statusChanged
        ? [...(shipment.events || []), buildStatusEvent(nextStatus, {
            ...shipment,
            currentLocation: {
              lat: autoPos.lat,
              lng: autoPos.lng,
              city: autoPos.city,
            },
          })]
        : shipment.events;

      const patch = transformShipmentToDB({
        currentLocation: {
          lat: autoPos.lat,
          lng: autoPos.lng,
          city: autoPos.city,
        },
        autoProgress: {
          ...shipment.autoProgress,
          lastUpdate: new Date().toISOString(),
        },
        status: nextStatus,
        events,
        updatedAt: new Date().toISOString(),
        ...(nextStatus === "delivered" ? { deliveredAt: new Date().toISOString() } : {}),
      });

      const { error: updateError } = await supabase
        .from("shipments")
        .update(patch)
        .eq("tracking_id", shipment.trackingId);

      if (!updateError) updated += 1;
    }

    return NextResponse.json({ ok: true, updated, total: data?.length || 0 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Cron failed" },
      { status: 500 }
    );
  }
}
