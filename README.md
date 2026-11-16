# VIC CAMS

React/Vite photo studio with analog film processing, local/remote photobooths, and a temporary gallery with optional private Supabase backups.

## Run locally

```sh
npm ci
npm run dev
```

Camera access requires localhost or HTTPS. Film Studio and Local Booth work without a backend.

## Turn on automatic database saving

1. In Supabase, open **SQL Editor → New query**. Paste and run [`supabase/migrations/202611150001_session_gallery.sql`](supabase/migrations/202611150001_session_gallery.sql). Run it once. It creates the `photo_creations` table, the private `session-photos` bucket, and ownership policies.
2. Under **Authentication → Sign In / Providers**, enable **Anonymous Sign-Ins**. This gives each tab an isolated visitor identity without asking visitors to register. Anonymous sign-in abuse protection/CAPTCHA may require an additional site integration; monitor project quotas before opening the site widely.
3. Add these build environment variables to Cloudflare Pages (and `.env` for local testing):

   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_YOUR_PUBLIC_KEY
   VITE_CLOUD_ARCHIVE_ENABLED=true
   ```

4. Redeploy/restart. The app displays a permanent-storage notice before uploads/captures. Test with one photo: the gallery should report **Saved to owner’s private storage**. In Supabase, check **Table Editor → photo_creations** and **Storage → session-photos**.

The public browser key cannot run the SQL migration or enable Anonymous Sign-Ins. Use the dashboard or an authenticated Supabase administration integration for those steps. No secret/service-role key belongs in the frontend.

The private bucket contains binary images; the table stores metadata and image paths. Visitors can upload/read/update only within their own authenticated identity. There is no visitor delete policy for permanent backups. The project owner can inspect and delete backups through the Supabase dashboard. Existing unrelated bucket/table policies were not audited by this migration.

## Session gallery behavior

- Each tab gets a random session ID. Gallery entries survive a refresh and disappear from the visible gallery in a fresh tab. Closing a tab does **not** delete the owner's database copies.
- Browser tab restoration can restore sessionStorage and its prior gallery. Normal new tabs get an empty gallery. IndexedDB entries from earlier sessions are hidden rather than destructively deleting historical photos; they remain on that browser's disk until browser data is cleared. This is a temporary visible gallery, not a promise of secure disk erasure.
- Each uploaded/captured Film Studio original saves immediately. The graded/framed result automatically saves after a one-second pause in editing. Exports update the same creation instead of adding duplicates.
- Local Booth saves each pose immediately and automatically saves the completed strip. Upload **4–8 JPEG/PNG/WebP photos** to create a strip without the camera. Reordering or adjusting the selected four updates the saved strip.
- Remote Duo photos remain ephemeral until **both people consent to permanent saving to the site owner's storage and downloads**. After consent, originals/paired images and the finished strip save automatically. Revoking consent stops later app saves; it does not erase existing copies or stop screenshots.
- Each gallery item reports local-only, pending, saved or failed cloud status. Retry failures before closing the tab. The app warns on tab exit while uploads are pending/failed, subject to browser restrictions. It cannot guarantee uploads after a tab/process closes or when offline; wait for successful status. Pending/failed saves are retried on refresh in the same tab.
- Removing a thumbnail only hides that local item. It does not remove an existing permanent backup. Cloud backups are not publicly browseable or listed in other visitors' galleries.
- With `VITE_CLOUD_ARCHIVE_ENABLED` missing/false, the app uses the session gallery only and explicitly says cloud saving is not enabled.

Image uploads are capped at 20 MB per file by the bucket. Full-resolution originals and rendered copies consume Supabase storage; the free tier has finite storage and request quotas. Quota failures are shown and downloads remain available. Very large images can also exceed browser canvas memory.

## Remote Duo

Use the same Supabase URL and publishable key. Under **Realtime → Settings**, allow public Broadcast channels. No photo data travels through public Broadcast: room topics and AES-GCM signaling keys use separate domain-separated derivations, and video/photos use encrypted WebRTC connections.

Host: Photobooth → Remote Duo → Create room → choose a private join phrase (4–64 characters) or leave blank for a random code → Create and choose strip. Camera permission is requested during room creation so the peers can connect before choosing a strip. Guest chooses Join room and enters the same code, or follows the invitation link. After connection, the host selects frame, layout and 4/6/8 poses. The guest sees those choices and the same frame preview. The host continues to cameras; both mark ready; host starts. Settings use acknowledged revisions: changing an option clears both ready states and shooting is blocked until the latest options are acknowledged. Each pose has its own ten-second countdown. The host schedules a shared timestamp; seven clock probes select a low-RTT clock offset. Selection and ordering synchronize through the peer data channel.

Random room codes contain 96 random bits plus a timestamp. Custom codes are normalized to lowercase, turn spaces into hyphens and require 4–64 letters/numbers/hyphens/underscores. They act as the room password; short/common codes such as poop are guessable, so use a unique private phrase when privacy matters. Custom signaling uses PBKDF2-SHA256 (210,000 iterations) with distinct key/topic material. Rooms expire an hour after host creation; guests use the expiry advertised by the host. Conflicting hosts are detected with encrypted presence probes, which are best-effort signaling rather than an atomic server reservation. Links put the room code in the URL fragment. Share links privately. Public Broadcast still permits project-quota abuse by people with the public key; client encryption is not server-side rate limiting.

For restricted networks, configure a TURN relay with `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL`. These frontend values are visible; use short-lived TURN credentials, never a permanent privileged secret. STUN alone does not connect every pair of networks.

A disconnect cancels active shooting. Both participants can reconnect with the same code and their existing roles. A refreshed host should create a new room and share its link. Hidden tabs cancel countdowns because browser background timing cannot be trusted.

References: [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous), [Storage access policies](https://supabase.com/docs/guides/storage/security/access-control), [Realtime Broadcast](https://supabase.com/docs/guides/realtime/broadcast).

## Cloudflare Pages

Connect `victorhuii/vic-cams`, choose **React (Vite)**, branch `main`, build command `npm run build`, output `dist`, root directory blank. Use Node 22.12+ or another release supported by the installed Vite version. Set environment variables before building; changing them requires a redeploy. The site is static; no Cloudflare Worker is required.

Cloudflare serves `public/_headers`, including the Content Security Policy, camera-only permissions, no-referrer and frame restrictions. Supabase project URLs use the standard `*.supabase.co` domains allowed by that policy; a custom Supabase domain needs a corresponding policy update.

## Features and checks

Eight original film-inspired canvas grades, non-destructive crop/rotation, six photo frames, PNG/JPEG export, real 4/6/8-pose camera capture, retakes, ordered four-photo selection, shared filters, single/duplicate strips, grid and print output. Film presets are interpretations, not exact commercial emulations. Grain sampling varies with render resolution; large exports process on the main thread. Booth crop adjustments apply globally.

```sh
npm run lint
npm run test
npm run build
npm run test:e2e
```

Chrome tests use a synthetic MediaDevices camera and actual canvas/IndexedDB/export code. Cloud unit tests mock the Supabase SDK to verify private path ownership, metadata writes, anonymous authentication and error propagation; they do not prove live database policies. Live storage/SQL and cross-network Remote Duo require configuration and manual/integration testing against the actual project. The opt-in test `VIC_TEST_LIVE_DUO=1 npm run test:e2e -- --grep "live Supabase peers"` uses actual configured Supabase Broadcast and two Chrome peers with synthetic camera streams to verify room choices and readiness; it never captures or uploads photos.

## Reference border and assets

Four-cut recreates the supplied brown LIFEFOURCUTS/인생네컷 reference at 528×1584 per strip. Duplicate columns contain the same four ordered photos. Remote pairs stay together in each duplicated row. Dates use the current browser-local YYYY.MM.DD; print output is 1200×1800.

Bundled Noto Sans KR (weight 200) and Roboto are close lettering matches, not verified originals; licenses are in `public/fonts`. Hamu Studio's public site does not provide a complete downloadable frame catalog. Other frame colors are original app templates.

Landscape preview: [Unsplash source](https://images.unsplash.com/photo-1470252649378-9c29740c9fa8). Cat previews reuse the supplied Mimicams assets. Preview artwork is never substituted for captured session photos. UI fonts use Google Fonts with system fallbacks.

### Remote Duo verification

Verified with the configured live Supabase Broadcast service and two local headless Chrome contexts using real WebRTC and synthetic MediaDevices streams: custom-code create/join, shared frame/layout/6-pose choices, guest read-only controls, camera-stage transitions, acknowledged settings and readiness resets, duplicate-host rejection, and a complete synchronized six-pose session. Both peers received all six paired captures and generated identical final strip pixels. Gallery entries stayed empty while permanent-save consent was off.

To rerun the capture check explicitly: `VIC_TEST_LIVE_CAPTURE=1 npm run test:e2e -- --grep "live remote six-pose"`. This takes about 80 seconds. It captures synthetic peer images in memory; it does not grant save consent. Physical cameras, separate devices, restricted networks and TURN remain separate deployment checks. No additional room SQL migration is required.
