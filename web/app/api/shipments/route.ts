import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateTrackingId, transformShipmentFromDB, transformShipmentToDB } from "@/lib/shipments";
import { shipmentCostFromPackage } from "@/lib/pricing";
import type { Shipment } from "@/lib/types";

export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipments")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({
      shipments: (data || []).map((row) => transformShipmentFromDB(row)),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de lister les envois" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const now = new Date().toISOString();
    const trackingId = generateTrackingId();

    // New shipments always start as pending — status advances via admin / auto-progress
    const shipment: Partial<Shipment> = {
      trackingId,
      status: "pending",
      createdAt: now,
      updatedAt: now,
      sender: body.sender || {},
      recipient: body.recipient || {},
      package: body.package || {},
      service: body.service || {},
      events: [
        {
          status: "pending",
          title: "Envoi créé",
          description: "Votre envoi a été enregistré et attend d’être ramassé.",
          location: body.sender?.address?.city,
          timestamp: now,
        },
      ],
      cost: body.cost || shipmentCostFromPackage({
        packageValue: body.package?.value,
        currency: body.package?.currency || "EUR",
        insured: Boolean(body.service?.insurance),
      }),
      estimatedDelivery: body.estimatedDelivery || null,
      currentLocation: {
        lat: body.sender?.address?.lat,
        lng: body.sender?.address?.lng,
        city: body.sender?.address?.city || "Origine",
        zip: body.sender?.address?.zip,
        country: body.sender?.address?.country || "France",
      },
      autoProgress: {
        enabled: true,
        paused: false,
        pausedAt: null,
        pauseReason: null,
        pausedDuration: 0,
        startedAt: null,
        lastUpdate: now,
      },
    };

    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("shipments")
      .insert([transformShipmentToDB(shipment)])
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ shipment: transformShipmentFromDB(data) }, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Impossible de créer l’envoi" },
      { status: 500 }
    );
  }
}
