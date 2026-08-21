import { PDFDocument, StandardFonts, rgb, RGB, PDFFont, PDFPage } from "pdf-lib";
import { readFile } from "fs/promises";
import path from "path";
import type { Shipment } from "./types";
import { localizedEventCopy } from "./shipment-status";

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 48;

function hex(r: number, g: number, b: number) {
  return rgb(r / 255, g / 255, b / 255);
}

const C = {
  primary: hex(37, 99, 235),
  primaryDark: hex(30, 64, 175),
  white: rgb(1, 1, 1),
  ink: hex(15, 23, 42),
  muted: hex(100, 116, 139),
  light: hex(248, 250, 252),
  border: hex(226, 232, 240),
  blueSoft: hex(239, 246, 255),
  green: hex(5, 150, 105),
  greenSoft: hex(236, 253, 245),
  amber: hex(217, 119, 6),
  amberSoft: hex(255, 251, 235),
  red: hex(220, 38, 38),
  redSoft: hex(254, 242, 242),
  indigo: hex(99, 102, 241),
  indigoSoft: hex(238, 242, 255),
};

function currencySymbol(code?: string) {
  const map: Record<string, string> = {
    USD: "$",
    EUR: "EUR ",
    GBP: "GBP ",
    XAF: "FCFA ",
    XOF: "CFA ",
    CAD: "CA$",
    CHF: "CHF ",
  };
  return map[(code || "USD").toUpperCase()] || `${(code || "USD").toUpperCase()} `;
}

function money(n: number | undefined, symbol: string) {
  const v = Number(n ?? 0);
  const formatted = Math.abs(v).toFixed(2).replace(".", ",");
  return `${v < 0 ? "-" : ""}${symbol}${formatted}`;
}

const FR_MONTHS = [
  "janv.",
  "fevr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "aout",
  "sept.",
  "oct.",
  "nov.",
  "dec.",
];

function fmtDate(value?: string | null) {
  if (!value) return "N/A";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "N/A";
  const day = String(d.getDate()).padStart(2, "0");
  const month = FR_MONTHS[d.getMonth()] || "";
  const hour = String(d.getHours()).padStart(2, "0");
  const minute = String(d.getMinutes()).padStart(2, "0");
  return `${day} ${month} ${d.getFullYear()}, ${hour}:${minute}`;
}

function frPackageType(type?: string) {
  const key = String(type || "").toLowerCase();
  if (key === "parcel") return "Colis";
  if (key === "document") return "Document";
  if (key === "freight") return "Fret";
  if (key === "vehicle") return "Vehicule";
  return type || "";
}

function frService(value?: string) {
  const key = String(value || "").toLowerCase();
  if (key === "standard") return "Standard";
  if (key === "express") return "Express";
  if (key === "economy") return "Economique";
  return value || "";
}

function safe(v?: string | number | null, fallback = "N/D") {
  if (v == null || String(v).trim() === "") return fallback;
  return String(v);
}

function statusMeta(status: string) {
  switch (status) {
    case "delivered":
      return {
        label: "LIVRE",
        color: C.green,
        soft: C.greenSoft,
        title: "Livraison reussie",
        text: "Cet envoi a ete remis au destinataire.",
      };
    case "out_for_delivery":
      return {
        label: "EN LIVRAISON",
        color: C.amber,
        soft: C.amberSoft,
        title: "En cours de livraison",
        text: "Le colis est chez le coursier et arrivera bientot.",
      };
    case "in_transit":
      return {
        label: "EN TRANSIT",
        color: C.primary,
        soft: C.blueSoft,
        title: "Colis en transit",
        text: "Votre envoi est en route. Le suivi se met a jour automatiquement.",
      };
    case "picked_up":
      return {
        label: "RAMASSE",
        color: C.indigo,
        soft: C.indigoSoft,
        title: "Colis ramasse",
        text: "L'envoi a ete ramasse et entre dans le reseau logistique.",
      };
    case "exception":
      return {
        label: "INCIDENT",
        color: C.red,
        soft: C.redSoft,
        title: "Action requise",
        text: "Un incident est survenu. Contactez Aurex Logistics au +33 6 44 68 49 20.",
      };
    default:
      return {
        label: "EN ATTENTE",
        color: C.red,
        soft: C.redSoft,
        title: "En attente de ramassage",
        text: "Cet envoi est enregistre et attend d'etre ramasse.",
      };
  }
}

const WINANSI_REPLACEMENTS: Record<string, string> = {
  "€": "EUR ",
  "£": "GBP ",
  "¥": "Y",
  "’": "'",
  "‘": "'",
  "‚": ",",
  "“": '"',
  "”": '"',
  "„": '"',
  "—": "-",
  "–": "-",
  "−": "-",
  "…": "...",
  "œ": "oe",
  "Œ": "OE",
  "æ": "ae",
  "Æ": "AE",
  "ß": "ss",
  "•": "-",
  "·": "-",
  "×": "x",
  "÷": "/",
  "™": "TM",
  "®": "(R)",
  "©": "(C)",
  "\u00a0": " ",
  "\u202f": " ",
  "\u2007": " ",
  "\u2009": " ",
  "\u200a": " ",
  "\u200b": "",
  "\u2060": "",
  "\ufeff": "",
};

function pdfSafe(text: string) {
  let out = "";
  for (const ch of String(text ?? "")) {
    if (WINANSI_REPLACEMENTS[ch] !== undefined) {
      out += WINANSI_REPLACEMENTS[ch];
      continue;
    }
    const code = ch.codePointAt(0) || 0;
    if (code === 0x09 || code === 0x0a || code === 0x0d) {
      out += " ";
      continue;
    }
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff && code !== 0xad)) {
      out += ch;
      continue;
    }
    const stripped = ch.normalize("NFD").replace(/\p{M}/gu, "");
    if (stripped && stripped !== ch) {
      for (const part of stripped) {
        const sc = part.codePointAt(0) || 0;
        if ((sc >= 0x20 && sc <= 0x7e) || (sc >= 0xa0 && sc <= 0xff)) out += part;
      }
      continue;
    }
    out += "?";
  }
  return out;
}

function drawText(
  page: PDFPage,
  text: string,
  x: number,
  y: number,
  size: number,
  font: PDFFont,
  color: RGB,
  maxWidth?: number
) {
  const raw = pdfSafe(text);
  if (!raw) return;
  try {
    const content = maxWidth ? truncateToWidth(raw, font, size, maxWidth) : raw;
    page.drawText(content, { x, y, size, font, color });
  } catch {
    const fallback = raw.replace(/[^\x20-\x7E]/g, "?");
    if (!fallback) return;
    const content = maxWidth ? truncateToWidth(fallback, font, size, maxWidth) : fallback;
    page.drawText(content, { x, y, size, font, color });
  }
}

function truncateToWidth(text: string, font: PDFFont, size: number, maxWidth: number) {
  try {
    if (font.widthOfTextAtSize(text, size) <= maxWidth) return text;
    let t = text;
    while (t.length > 0 && font.widthOfTextAtSize(`${t}...`, size) > maxWidth) {
      t = t.slice(0, -1);
    }
    return `${t}...`;
  } catch {
    const ascii = text.replace(/[^\x20-\x7E]/g, "?");
    if (ascii.length * size * 0.5 <= maxWidth) return ascii;
    return `${ascii.slice(0, Math.max(1, Math.floor(maxWidth / (size * 0.5))))}...`;
  }
}

function addressOf(party?: Shipment["sender"]) {
  if (!party?.address) return "N/D";
  const cityLine = [party.address.zip, party.address.city].filter(Boolean).join(" ");
  return (
    [party.address.street, cityLine, party.address.state, party.address.country]
      .filter(Boolean)
      .join(", ") || "N/D"
  );
}

export async function generateReceiptPdfBuffer(shipment: Shipment): Promise<Buffer> {
  const pdfDoc = await PDFDocument.create();
  pdfDoc.setTitle(`Recu Aurex Logistics ${shipment.trackingId}`);
  pdfDoc.setAuthor("Aurex Logistics");
  pdfDoc.setSubject("Recu officiel d'envoi");
  pdfDoc.setCreator("Aurex Logistics Platform");

  const page = pdfDoc.addPage([PAGE_W, PAGE_H]);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const status = shipment.status || "pending";
  const meta = statusMeta(status);
  const symbol = currencySymbol(shipment.cost?.currency || shipment.package?.currency);
  const generatedAt = new Date().toISOString();
  const docId = `AX-RCPT-${shipment.trackingId}-${Date.now().toString().slice(-6)}`;

  // ===== HEADER =====
  page.drawRectangle({ x: 0, y: PAGE_H - 108, width: PAGE_W, height: 108, color: C.primary });
  page.drawRectangle({ x: 0, y: PAGE_H - 112, width: PAGE_W, height: 4, color: C.primaryDark });

  // Header bar stays brand blue; place logo on a white plate for contrast
  page.drawRectangle({
    x: MARGIN - 4,
    y: PAGE_H - 90,
    width: 118,
    height: 52,
    color: C.white,
  });
  try {
    const logoPath = path.join(process.cwd(), "public", "aurex-logo-light.png");
    const logoBytes = await readFile(logoPath);
    const logo = await pdfDoc.embedPng(logoBytes);
    const logoH = 44;
    const logoW = Math.min((logo.width / logo.height) * logoH, 110);
    page.drawImage(logo, {
      x: MARGIN,
      y: PAGE_H - 86,
      width: logoW,
      height: logoH,
    });
  } catch {
    drawText(page, "Aurex Logistics", MARGIN, PAGE_H - 58, 20, fontBold, C.white);
  }

  drawText(page, "Fret mondial. Suivi clair.", MARGIN, PAGE_H - 98, 9, font, hex(191, 219, 254));
  drawText(page, "RECU OFFICIEL D'ENVOI", PAGE_W - MARGIN - 190, PAGE_H - 52, 11, fontBold, C.white);
  drawText(page, docId, PAGE_W - MARGIN - 190, PAGE_H - 68, 8, font, hex(191, 219, 254));

  let y = PAGE_H - 140;

  // ===== TRACKING BOX =====
  page.drawRectangle({
    x: MARGIN,
    y: y - 28,
    width: PAGE_W - MARGIN * 2,
    height: 54,
    color: C.blueSoft,
    borderColor: C.primary,
    borderWidth: 1.5,
  });
  drawText(page, "NUMERO DE SUIVI", MARGIN + 16, y + 8, 9, font, C.primary);
  drawText(page, shipment.trackingId, MARGIN + 16, y - 14, 22, fontBold, C.ink);

  y -= 70;

  // ===== STATUS + DATES =====
  drawText(page, "Informations d'envoi", MARGIN, y, 13, fontBold, C.primary);
  y -= 22;

  const badgeLabel = meta.label;
  const badgeW = fontBold.widthOfTextAtSize(badgeLabel, 10) + 20;
  page.drawRectangle({
    x: MARGIN,
    y: y - 4,
    width: badgeW,
    height: 18,
    color: meta.color,
  });
  drawText(page, badgeLabel, MARGIN + 10, y, 10, fontBold, C.white);

  y -= 28;
  const col = (PAGE_W - MARGIN * 2) / 2;
  drawText(page, "Cree le", MARGIN, y, 8, font, C.muted);
  drawText(page, "Derniere mise a jour", MARGIN + col, y, 8, font, C.muted);
  y -= 14;
  drawText(page, fmtDate(shipment.createdAt), MARGIN, y, 10, fontBold, C.ink);
  drawText(page, fmtDate(shipment.updatedAt), MARGIN + col, y, 10, fontBold, C.ink);
  y -= 18;
  drawText(page, "Livraison estimee", MARGIN, y, 8, font, C.muted);
  drawText(
    page,
    status === "delivered" ? "Livre le" : "Position actuelle",
    MARGIN + col,
    y,
    8,
    font,
    C.muted
  );
  y -= 14;
  drawText(page, fmtDate(shipment.estimatedDelivery), MARGIN, y, 10, fontBold, C.ink);
  drawText(
    page,
    status === "delivered"
      ? fmtDate(shipment.deliveredAt)
      : safe(shipment.currentLocation?.city, "En reseau"),
    MARGIN + col,
    y,
    10,
    fontBold,
    C.ink
  );

  // Status message banner
  y -= 28;
  page.drawRectangle({
    x: MARGIN,
    y: y - 18,
    width: PAGE_W - MARGIN * 2,
    height: 36,
    color: meta.soft,
    borderColor: meta.color,
    borderWidth: 1,
  });
  drawText(page, meta.title, MARGIN + 12, y + 2, 10, fontBold, meta.color);
  drawText(page, meta.text, MARGIN + 12, y - 12, 8, font, C.ink, PAGE_W - MARGIN * 2 - 24);

  // ===== SENDER / RECIPIENT CARDS =====
  y -= 50;
  const cardW = (PAGE_W - MARGIN * 2 - 14) / 2;
  const cardH = 128;
  const cardY = y - cardH;

  function partyCard(
    x: number,
    title: string,
    name: string,
    email: string,
    phone: string,
    address: string
  ) {
    page.drawRectangle({
      x,
      y: cardY,
      width: cardW,
      height: cardH,
      color: C.light,
      borderColor: C.border,
      borderWidth: 1,
    });
    drawText(page, title, x + 12, cardY + cardH - 18, 11, fontBold, C.primary);
    page.drawRectangle({
      x: x + 12,
      y: cardY + cardH - 26,
      width: cardW - 24,
      height: 0.8,
      color: C.border,
    });
    drawText(page, name, x + 12, cardY + cardH - 44, 11, fontBold, C.ink, cardW - 24);
    drawText(page, "E-mail", x + 12, cardY + cardH - 60, 7, font, C.muted);
    drawText(page, email, x + 12, cardY + cardH - 72, 9, font, C.ink, cardW - 24);
    drawText(page, "Telephone", x + 12, cardY + cardH - 86, 7, font, C.muted);
    drawText(page, phone, x + 12, cardY + cardH - 98, 9, font, C.ink, cardW - 24);
    drawText(page, "Adresse", x + 12, cardY + cardH - 112, 7, font, C.muted);
    drawText(page, address, x + 12, cardY + 8, 8, font, C.ink, cardW - 24);
  }

  partyCard(
    MARGIN,
    "EXPEDITEUR",
    safe(shipment.sender?.name),
    safe(shipment.sender?.email),
    safe(shipment.sender?.phone),
    addressOf(shipment.sender)
  );
  partyCard(
    MARGIN + cardW + 14,
    "DESTINATAIRE",
    safe(shipment.recipient?.name),
    safe(shipment.recipient?.email),
    safe(shipment.recipient?.phone),
    addressOf(shipment.recipient)
  );

  y = cardY - 24;

  // ===== PACKAGE =====
  drawText(page, "Details du colis", MARGIN, y, 13, fontBold, C.primary);
  y -= 12;
  const pkgH = 78;
  page.drawRectangle({
    x: MARGIN,
    y: y - pkgH,
    width: PAGE_W - MARGIN * 2,
    height: pkgH,
    color: C.light,
    borderColor: C.border,
    borderWidth: 1,
  });
  const pkgTop = y - 16;
  drawText(page, "Type", MARGIN + 14, pkgTop, 7, font, C.muted);
  drawText(page, safe(frPackageType(shipment.package?.type)), MARGIN + 14, pkgTop - 12, 10, fontBold, C.ink);
  drawText(page, "Poids", MARGIN + 150, pkgTop, 7, font, C.muted);
  drawText(
    page,
    `${safe(shipment.package?.weight)} kg`,
    MARGIN + 150,
    pkgTop - 12,
    10,
    fontBold,
    C.ink
  );
  drawText(page, "Prestation", MARGIN + 280, pkgTop, 7, font, C.muted);
  drawText(
    page,
    `${safe(frService(shipment.service?.type))} / ${safe(frService(shipment.service?.priority))}`,
    MARGIN + 280,
    pkgTop - 12,
    10,
    fontBold,
    C.ink,
    220
  );
  drawText(page, "Description", MARGIN + 14, pkgTop - 34, 7, font, C.muted);
  drawText(
    page,
    safe(shipment.package?.description, "Aucune description"),
    MARGIN + 14,
    pkgTop - 48,
    9,
    font,
    C.ink,
    PAGE_W - MARGIN * 2 - 28
  );
  drawText(
    page,
    `Valeur declaree : ${money(shipment.package?.value, currencySymbol(shipment.package?.currency || shipment.cost?.currency))}`,
    MARGIN + 14,
    pkgTop - 64,
    9,
    font,
    C.ink
  );

  y = y - pkgH - 22;

  // ===== COSTS =====
  drawText(page, "Resume des couts", MARGIN, y, 13, fontBold, C.primary);
  y -= 12;
  const costH = 86;
  page.drawRectangle({
    x: MARGIN,
    y: y - costH,
    width: PAGE_W - MARGIN * 2,
    height: costH,
    color: C.white,
    borderColor: C.border,
    borderWidth: 1,
  });

  const rows: [string, string][] = [
    ["Service de base", money(shipment.cost?.base, symbol)],
    ["Transport", money(shipment.cost?.shipping, symbol)],
    ["Assurance", money(shipment.cost?.insurance, symbol)],
  ];
  let ry = y - 18;
  for (const [label, value] of rows) {
    drawText(page, label, MARGIN + 16, ry, 10, font, C.muted);
    drawText(page, value, PAGE_W - MARGIN - 100, ry, 10, fontBold, C.ink);
    ry -= 16;
  }
  page.drawRectangle({
    x: MARGIN + 12,
    y: y - costH + 8,
    width: PAGE_W - MARGIN * 2 - 24,
    height: 22,
    color: C.blueSoft,
  });
  drawText(page, "TOTAL", MARGIN + 20, y - costH + 14, 10, fontBold, C.primary);
  drawText(
    page,
    money(shipment.cost?.total, symbol),
    PAGE_W - MARGIN - 110,
    y - costH + 14,
    12,
    fontBold,
    C.primary
  );

  y = y - costH - 20;

  // ===== TIMELINE (latest events) =====
  const events = (shipment.events || []).slice(-4).reverse();
  if (events.length > 0 && y > 120) {
    drawText(page, "Activite recente", MARGIN, y, 13, fontBold, C.primary);
    y -= 16;
    for (const ev of events) {
      if (y < 90) break;
      const copy = localizedEventCopy(ev);
      page.drawCircle({ x: MARGIN + 6, y: y + 3, size: 3, color: C.primary });
      drawText(
        page,
        safe(copy.title || ev.status),
        MARGIN + 18,
        y,
        9,
        fontBold,
        C.ink,
        280
      );
      drawText(page, fmtDate(ev.timestamp), MARGIN + 310, y, 8, font, C.muted);
      y -= 12;
      if (copy.description || ev.location) {
        drawText(
          page,
          [copy.description, ev.location].filter(Boolean).join(" · "),
          MARGIN + 18,
          y,
          8,
          font,
          C.muted,
          PAGE_W - MARGIN * 2 - 30
        );
        y -= 14;
      } else {
        y -= 8;
      }
    }
  }

  // ===== FOOTER =====
  page.drawRectangle({ x: 0, y: 0, width: PAGE_W, height: 58, color: C.light });
  page.drawRectangle({ x: 0, y: 58, width: PAGE_W, height: 1.2, color: C.border });
  drawText(
    page,
    "Document officiel emis par Aurex Logistics. Verifiez l'authenticite avec le numero de suivi ci-dessus.",
    MARGIN,
    38,
    7,
    font,
    C.muted,
    PAGE_W - MARGIN * 2
  );
  drawText(page, `Genere le ${fmtDate(generatedAt)}  ·  ${docId}`, MARGIN, 22, 7, font, C.muted);
  drawText(page, "+33 6 44 68 49 20", PAGE_W - MARGIN - 95, 34, 7, fontBold, C.primary);
  drawText(page, "logisticsaurex@gmail.com", PAGE_W - MARGIN - 118, 22, 7, fontBold, C.primary);

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}
