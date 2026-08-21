import type { Metadata, Viewport } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import ChatBubbleWidget from "@/components/ChatBubbleWidget";
import { I18nProvider } from "@/lib/i18n/context";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurex Logistics | Suivi de fret et logistique",
  description:
    "Suivez vos envois routiers, aériens, maritimes et véhicules en temps réel. Timelines claires, cartes live et support pour le fret national et international.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="bg-background antialiased">
        <I18nProvider>
          <SiteHeader />
          <main className="min-w-0 overflow-x-hidden">{children}</main>
          <SiteFooter />
          <ChatBubbleWidget />
        </I18nProvider>
      </body>
    </html>
  );
}
