import EstimateClient from "./EstimateClient";

export const metadata = {
  title: "Devis | Aurex Logistics",
  description: "Obtenez une estimation indicative pour le fret routier, aérien, maritime ou véhicules.",
};

export default function EstimatePage() {
  return <EstimateClient />;
}
