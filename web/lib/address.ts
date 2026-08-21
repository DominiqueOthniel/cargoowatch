import type { Address } from "@/lib/types";

export const FRANCE = "France";

export const FR_CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Toulouse",
  "Bordeaux",
  "Nantes",
  "Strasbourg",
  "Nice",
  "Rennes",
  "Le Havre",
  "Rouen",
  "Montpellier",
  "Grenoble",
  "Dijon",
  "Tours",
  "Orléans",
  "Reims",
  "Clermont-Ferrand",
  "Metz",
];

export function isFrance(country?: string) {
  const c = (country || "").trim().toLowerCase();
  return c === "france" || c === "fr" || c === "français" || c === "francais";
}

export function isFrenchPostalCode(zip?: string) {
  return /^\d{5}$/.test((zip || "").trim());
}

export function formatAddress(address?: Address | null) {
  if (!address) return "";
  const cityLine = [address.zip, address.city].filter(Boolean).join(" ");
  return [address.street, cityLine, address.state, address.country].filter(Boolean).join(", ");
}

export function geocodeQuery(address: {
  street?: string;
  zip?: string;
  city: string;
  country: string;
}) {
  return [address.street, address.zip, address.city, address.country || FRANCE]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(", ");
}

export async function geocodeAddress(address: {
  street?: string;
  zip?: string;
  city: string;
  country: string;
}) {
  const country = address.country?.trim() || FRANCE;
  const params = new URLSearchParams({
    format: "json",
    limit: "1",
    q: geocodeQuery({ ...address, country }),
  });
  if (isFrance(country)) params.set("countrycodes", "fr");

  const res = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "AurexLogistics/1.0 (logisticsaurex@gmail.com)",
    },
  });
  const data = await res.json();
  if (!data?.[0]) return null;
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
}
