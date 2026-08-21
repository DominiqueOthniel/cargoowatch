import { NextResponse } from "next/server";
import { fetchOsrmRoute } from "@/lib/auto-progress";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const oLat = Number(searchParams.get("oLat"));
  const oLng = Number(searchParams.get("oLng"));
  const dLat = Number(searchParams.get("dLat"));
  const dLng = Number(searchParams.get("dLng"));

  if (![oLat, oLng, dLat, dLng].every((n) => Number.isFinite(n))) {
    return NextResponse.json({ error: "Coordonnées invalides" }, { status: 400 });
  }

  const route = await fetchOsrmRoute(oLat, oLng, dLat, dLng);
  if (!route || route.geometry.length < 2) {
    return NextResponse.json({ error: "Itinéraire introuvable" }, { status: 404 });
  }

  return NextResponse.json({
    geometry: route.geometry,
    distanceMiles: route.distanceMiles,
  });
}
