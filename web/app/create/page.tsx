"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FR_CITIES, FRANCE, geocodeAddress, isFrance, isFrenchPostalCode } from "@/lib/address";
import { useAdminSession } from "@/lib/use-admin-session";

function AddressBlock({ prefix, title }: { prefix: "sender" | "recipient"; title: string }) {
  return (
    <section className="card p-6">
      <h2 className="mb-4 text-lg font-semibold text-text-primary">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          name={`${prefix}Name`}
          placeholder="Nom complet"
          className="input-field px-3 py-2.5"
          required
        />
        <input
          name={`${prefix}Email`}
          type="email"
          placeholder="E-mail"
          className="input-field px-3 py-2.5"
          required
        />
        <input
          name={`${prefix}Phone`}
          type="tel"
          placeholder="+33 6 00 00 00 00"
          className="input-field px-3 py-2.5 sm:col-span-2"
        />
        <input
          name={`${prefix}Street`}
          placeholder="N° et rue"
          className="input-field px-3 py-2.5 sm:col-span-2"
          required
        />
        <input
          name={`${prefix}Zip`}
          placeholder="Code postal"
          inputMode="numeric"
          maxLength={10}
          className="input-field px-3 py-2.5"
          required
        />
        <input
          name={`${prefix}City`}
          placeholder="Ville"
          list="fr-cities"
          className="input-field px-3 py-2.5"
          required
        />
        <input
          name={`${prefix}Country`}
          defaultValue={FRANCE}
          placeholder="Pays"
          className="input-field px-3 py-2.5 sm:col-span-2"
          required
        />
      </div>
    </section>
  );
}

export default function CreateShipmentForm() {
  const router = useRouter();
  const isAdmin = useAdminSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessId(null);

    const fd = new FormData(e.currentTarget);
    const sender = {
      street: String(fd.get("senderStreet") || ""),
      zip: String(fd.get("senderZip") || "").trim(),
      city: String(fd.get("senderCity") || "").trim(),
      country: String(fd.get("senderCountry") || FRANCE).trim() || FRANCE,
    };
    const recipient = {
      street: String(fd.get("recipientStreet") || ""),
      zip: String(fd.get("recipientZip") || "").trim(),
      city: String(fd.get("recipientCity") || "").trim(),
      country: String(fd.get("recipientCountry") || FRANCE).trim() || FRANCE,
    };

    try {
      if (isFrance(sender.country) && !isFrenchPostalCode(sender.zip)) {
        throw new Error("Code postal expéditeur invalide (5 chiffres, ex. 75001).");
      }
      if (isFrance(recipient.country) && !isFrenchPostalCode(recipient.zip)) {
        throw new Error("Code postal destinataire invalide (5 chiffres, ex. 69001).");
      }

      const [senderCoords, recipientCoords] = await Promise.all([
        geocodeAddress(sender),
        geocodeAddress(recipient),
      ]);

      if (!senderCoords) {
        throw new Error("Adresse expéditeur introuvable. Vérifiez rue, code postal et ville.");
      }
      if (!recipientCoords) {
        throw new Error("Adresse destinataire introuvable. Vérifiez rue, code postal et ville.");
      }

      const payload = {
        sender: {
          name: String(fd.get("senderName") || ""),
          email: String(fd.get("senderEmail") || ""),
          phone: String(fd.get("senderPhone") || ""),
          address: { ...sender, ...senderCoords },
        },
        recipient: {
          name: String(fd.get("recipientName") || ""),
          email: String(fd.get("recipientEmail") || ""),
          phone: String(fd.get("recipientPhone") || ""),
          address: { ...recipient, ...recipientCoords },
        },
        package: {
          type: String(fd.get("packageType") || "parcel"),
          weight: Number(fd.get("packageWeight") || 1),
          description: String(fd.get("packageDescription") || ""),
          value: Number(fd.get("packageValue") || 0),
          currency: String(fd.get("currency") || "EUR"),
        },
        service: {
          type: String(fd.get("serviceType") || "standard"),
          priority: String(fd.get("servicePriority") || "normal"),
          insurance: fd.get("insurance") === "on",
        },
        estimatedDelivery: String(fd.get("estimatedDelivery") || "") || null,
      };

      const res = await fetch("/api/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Création impossible");
      setSuccessId(data.shipment.trackingId);
      setTimeout(() => router.push(`/track?id=${data.shipment.trackingId}&from=admin`), 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {isAdmin && (
        <div className="border-b border-border bg-secondary text-white">
          <div className="mx-auto flex max-w-3xl flex-wrap items-center justify-between gap-2 px-4 py-2.5">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/70">Admin</p>
            <div className="flex flex-wrap gap-2">
              <Link href="/admin" className="rounded-md bg-white px-3 py-1.5 text-xs font-semibold text-secondary">
                Retour admin
              </Link>
              <Link href="/track" className="rounded-md border border-white/25 px-3 py-1.5 text-xs font-semibold text-white">
                Suivi
              </Link>
            </div>
          </div>
        </div>
      )}
      <section className="bg-gradient-to-br from-primary-50 to-secondary-50 py-12">
        <div className="mx-auto max-w-3xl px-4 text-center">
          <h1 className="text-3xl font-bold text-text-primary lg:text-4xl">
            Créer un <span className="text-gradient-primary">envoi</span>
          </h1>
          <p className="mt-3 text-text-secondary">
            Adresses France en priorité : rue, code postal et ville. Le géocodage place le colis
            sur la carte.
          </p>
        </div>
      </section>

      <datalist id="fr-cities">
        {FR_CITIES.map((city) => (
          <option key={city} value={city} />
        ))}
      </datalist>

      <form onSubmit={onSubmit} className="mx-auto max-w-3xl space-y-6 px-4 py-10 sm:px-6">
        <AddressBlock prefix="sender" title="Expéditeur" />
        <AddressBlock prefix="recipient" title="Destinataire" />

        <section className="card p-6">
          <h2 className="mb-4 text-lg font-semibold text-text-primary">Colis et service</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <select name="packageType" className="input-field px-3 py-2.5" defaultValue="parcel">
              <option value="parcel">Colis</option>
              <option value="document">Document</option>
              <option value="freight">Fret</option>
              <option value="vehicle">Véhicule</option>
            </select>
            <input
              name="packageWeight"
              type="number"
              min="0"
              step="0.1"
              placeholder="Poids (kg)"
              className="input-field px-3 py-2.5"
            />
            <input
              name="packageValue"
              type="number"
              step="0.01"
              placeholder="Valeur"
              className="input-field px-3 py-2.5"
            />
            <select name="currency" className="input-field px-3 py-2.5" defaultValue="EUR">
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
              <option value="XAF">XAF</option>
            </select>
            <input
              name="packageDescription"
              placeholder="Description"
              className="input-field px-3 py-2.5 sm:col-span-2"
            />
            <select name="serviceType" className="input-field px-3 py-2.5" defaultValue="standard">
              <option value="standard">Standard</option>
              <option value="express">Express</option>
              <option value="economy">Économique</option>
            </select>
            <input name="estimatedDelivery" type="datetime-local" className="input-field px-3 py-2.5" />
            <p className="text-xs text-text-muted sm:col-span-2">
              Tout nouvel envoi démarre en <strong>En attente</strong>. Dans l’admin, cliquez{" "}
              <strong>Démarrer</strong> : la progression avance seule jusqu’à la livraison, sauf
              pause manuelle.
            </p>
            <label className="flex items-center gap-2 text-sm text-text-secondary sm:col-span-2">
              <input name="insurance" type="checkbox" /> Assurance (50 % de la valeur déclarée)
            </label>
          </div>
        </section>

        {error && (
          <div className="rounded-lg border border-red-200 bg-error-50 px-4 py-3 text-sm text-error">
            {error}
          </div>
        )}
        {successId && (
          <div className="rounded-lg border border-green-200 bg-success-50 px-4 py-3 text-sm text-success">
            Créé : <strong>{successId}</strong> — redirection…
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-primary px-8 py-3 text-lg disabled:opacity-60">
          {loading ? "Création…" : "Créer l’envoi"}
        </button>
      </form>
    </div>
  );
}
