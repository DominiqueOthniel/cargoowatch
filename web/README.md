# Aurex Logistics Web (Next.js + Supabase + Netlify)

Application full-stack sans serveur Express : UI + API Routes Next.js, données/auth/realtime Supabase, hébergement Netlify.

## Prérequis

- Node.js 18+
- Projet [Supabase](https://supabase.com)
- Compte [Netlify](https://netlify.com) (déploiement)

## Setup local

```bash
cd web
cp .env.example .env.local
# Remplir les variables Supabase + CRON_SECRET
npm install
npm run dev
```

Ouvrir http://localhost:3000

## Variables d'environnement

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé anon (publique) |
| `SUPABASE_SERVICE_ROLE_KEY` | Clé service role (serveur uniquement) |
| `CRON_SECRET` | Bearer token pour `/api/cron/auto-progress` |
| `ADMIN_EMAIL` | Email de connexion admin (sans Supabase Auth) |
| `ADMIN_PASSWORD` | Mot de passe admin |
| `ADMIN_SESSION_SECRET` | Secret de session cookie (optionnel si `ADMIN_PASSWORD` est défini) |

## Schéma Supabase

1. Ouvrir **SQL Editor** dans Supabase
2. Exécuter [`supabase/schema.sql`](./supabase/schema.sql)
3. **Database → Replication** : activer Realtime sur `chat_messages` (le script tente aussi `ALTER PUBLICATION`)

### Créer un admin

Le login admin n'utilise plus Supabase Auth. Définir `ADMIN_EMAIL`, `ADMIN_PASSWORD` et `ADMIN_SESSION_SECRET` dans `.env.local` et dans Netlify (Site configuration → Environment variables), puis redéployer.

## Pages

| Route | Rôle |
|-------|------|
| `/` | Accueil |
| `/track` | Tracking public + carte Leaflet |
| `/create` | Création d'envoi |
| `/support` | Chat client (Realtime) |
| `/admin/login` | Login admin (Supabase Auth) |
| `/admin` | Dashboard (envois, pause, chat) |

## API

| Méthode | Chemin | Description |
|---------|--------|-------------|
| GET/POST | `/api/shipments` | Liste / création |
| GET/PATCH/DELETE | `/api/shipments/:trackingId` | Détail / MAJ statut-pause / suppression |
| GET/POST | `/api/chat` | Liste / démarrer conversation |
| GET/PATCH | `/api/chat/:chatId` | Détail / fermer |
| POST | `/api/chat/:chatId/message` | Envoyer un message |
| GET/POST | `/api/cron/auto-progress` | Progression auto (auth Bearer) |

## Receipts PDF

1. Create a **public** Storage bucket named `receipts` in Supabase (Storage → New bucket).
2. In Admin → Shipments, click **PDF Receipt** on a shipment.
3. Files appear in the **Receipts** tab.

## Live chat

A floating chat bubble appears on all public pages (hidden on `/admin`).
Admin replies from **Admin → Chat**.

## Cron (progression automatique)

Sur Netlify (ou cron-job.org), planifier **chaque minute** :

```http
POST https://VOTRE_SITE.netlify.app/api/cron/auto-progress
Authorization: Bearer VOTRE_CRON_SECRET
```

Sans cron, la position est aussi recalculée à chaque lecture du tracking.

## Déploiement Netlify

1. Nouveau site depuis Git, **Base directory** : `web` (ou racine du repo si vous ne déployez que `web/`)
2. Build command : `npm run build` (déjà dans `netlify.toml`)
3. Plugin `@netlify/plugin-nextjs` (dans `netlify.toml`)
4. Ajouter les 4 variables d'environnement ci-dessus
5. Déployer

Checklist :

- [ ] `schema.sql` exécuté
- [ ] Realtime `chat_messages` activé
- [ ] Admin créé + `role = admin`
- [ ] Variables Netlify configurées
- [ ] Cron externe ou scheduled function configuré

## Stack

- Next.js 15 App Router
- Supabase Auth + Postgres + Realtime
- Tailwind CSS 4
- Leaflet / react-leaflet
- Netlify Next runtime

L'ancien backend Express dans le dossier parent reste intact comme référence.
