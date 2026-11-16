# VIC CAMS

A browser photo studio and four-cut photobooth. Built in this separate workspace to preserve the existing Mimicams gesture-camera project.

## Run

```sh
npm ci
npm run dev
```

Open the Local URL printed by Vite. Camera access works on localhost or HTTPS. No account, API key, or backend is needed for Film Studio, Local Booth, or the archive.

## Included

- Responsive cream/pastel homepage with instant-photo and four-cut previews.
- JPEG, PNG and WebP upload/drop; real camera capture; original preservation.
- Eight original film-inspired pixel-processing configurations; deterministic luminance-dependent grain, highlight shoulder, color temperature/tint, saturation, contrast, exposure, fade, vignette and highlight glow. These are interpretations, not exact commercial film emulations.
- Non-destructive adjustments, before/after hold, crop ratios, zoom, position, rotation, six frame options, editable paper, caption/date, full-resolution PNG/JPEG composites. No Border exports just the graded crop.
- 4/6/8 camera poses, individual 10-second countdowns, flash, automatic progression, pause/resume, cancellation, retakes, exactly four ordered selections and global filter/crop changes.
- Modular frame definitions in `src/features/booth/render.ts`; original Korean-style four-cut default. The supplied reference screenshot was not available as an on-disk asset, so no screenshot was extracted or copied into a template.
- Vertical strip, grid, and 1200×1800 portrait 4×6 print sheet with two strips. Print at 4×6 inches (300 pixels/inch); disable printer scaling. Remote paired strips necessarily fit wider rows into the print windows.
- IndexedDB source/capture and creation archive; reopen, edit, download, delete, persistence after refresh, actionable storage errors. Remote captures are not archived before mutual consent.
- Remote Duo uses real WebRTC video and reliable chunked data transfer; Supabase Realtime carries encrypted signaling only. Both participants must indicate readiness. Host schedules shared capture timestamps; seven clock probes select the lowest RTT offset. Photos and configuration/selection travel through the peer channel. Both sides render host-first pairs in identical order.

## Configure Remote Duo

1. Create a Supabase project and enable Realtime Broadcast. Anonymous public Broadcast channels must be allowed; no database tables or user authentication are needed. The app encrypts signaling with AES-GCM using a key derived from the unguessable shared room code and hashes that code for the Broadcast topic. Public channel access does **not** give observers the room secret or photo data.
2. Copy `.env.example` to `.env`. Set the project URL and public **publishable** key. Never put a secret/service-role key in any `VITE_` variable.
3. Restart Vite (or rebuild the deployment). Room links use a URL fragment so their secret is not sent as a normal HTTP path or query. Share privately. Codes contain 96 random bits plus a timestamp and expire after an hour. No room record or photograph is stored on Supabase.
4. For reliable access from restricted networks, configure TURN. Browser-visible TURN credentials should be short-lived credentials issued by your provider, not a long-lived privileged secret. STUN alone cannot connect every network pair.
5. Host: Remote Duo → Open camera → Create private room → Copy invitation link. Guest opens link, grants camera access, and clicks Join. Each person checks ready; host starts. Each person may independently grant/revoke permission to save. Export stays disabled until both consent and all four selected pairs arrive.

If disconnected, the active countdown is canceled. Both people should click Join / reconnect room using the same code (their existing host/guest roles are retained). This renegotiates the peer connection, while current-tab captures remain in memory. A refresh intentionally discards unsaved remote photographs; rejoin and start a new synchronized session. A canceled/paused session can resume remaining poses with a fresh countdown. Hidden tabs cancel active capture because background browser timing cannot be trusted.

Protocol references: [Supabase Broadcast](https://supabase.com/docs/guides/realtime/broadcast), [WebRTC peer connections](https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection).

## Verify

```sh
npm run lint       # strict TypeScript validation
npm run test       # film pixels, crop ratios and room expiry
npm run build      # production bundle
npm run test:e2e   # installed Chrome: fake browser camera, real canvas/capture/export/IndexedDB
```

Browser tests use Chrome's synthetic camera input. This exercises actual MediaDevices/video/canvas capture without physical camera access. It does not establish real cross-network Remote Duo acceptance. To verify that, configure Supabase and TURN, open two devices on different networks, compare pose times and paired strip order, test disconnect/rejoin, and inspect consent-gated saving. No live Supabase credentials were provided for that test.

## Cloudflare Pages

Build command: `npm run build`. Output directory: `dist`. Use a current Node release supported by Vite (Node 22.12+). Set the public `VITE_` variables in the build environment before deploying. No Worker, server routes or database migration is required. Camera and encrypted remote signaling require HTTPS outside localhost. The app uses a single HTML route; invitation state is in the URL fragment.

## Privacy and limits

Local storage is per browser/origin; it is not a backup. Clearing browser data, private browsing, quotas, or browser eviction may erase the archive. Keep important downloads. A storage save error is displayed; downloads remain available by retrying after freeing space. Very large camera files can exceed mobile canvas memory; exports currently process on the main thread, so very large images may pause the UI. Grain is deterministic for a given output resolution; preview and full-resolution output have different grain sampling.

Film bloom uses a blurred luminance mask with a warm halation tint for Cine; it is not a calibrated optical model. Booth cropping is global for the four selected rows. Changing export mirroring is supported before capture; previously captured originals keep their original orientation. Captions and dates use the current local date. Full physical camera, print color calibration, and two-device network synchronization require manual validation. The privacy note's save consent is an app control, not protection against a participant taking a screenshot.

Preview assets: bundled landscape photo from [Unsplash](https://images.unsplash.com/photo-1470252649378-9c29740c9fa8); existing cat photos reused from the provided Mimicams assets. The cat photos are example artwork, never session captures. Typography uses Google Fonts with system fallbacks.

## Security review

The Supabase publishable key is intentionally included in the browser bundle; `.env` exclusion does not hide `VITE_` values from visitors. Never supply secret/service-role keys or permanent privileged TURN credentials. Room-topic hashes and signaling encryption keys use different domain-separated derivations. Room links grant access and should stay private. Peer photo transfers have bounded chunk counts and concurrent assemblies. Cloudflare Pages serves the security headers in `public/_headers`, including a Content Security Policy.

Public Supabase Broadcast access still allows project quota abuse by someone with the publishable key; encrypted signaling does not provide server-side rate limiting. The app does not create database tables or buckets. If this project has other tables/buckets, review their RLS and storage policies in Supabase before sharing the site. No dashboard policies or deployed Cloudflare settings were audited from this workspace. Cross-network Remote Duo still needs testing.

## Reference four-cut border

The Four-cut template recreates the user-supplied brown LIFEFOURCUTS/인생네컷 reference at 528×1584 per strip. Two matching strips duplicate the same four ordered photographs in each column; remote photos remain paired within each duplicated row. Date stamps use the browser's current local date as YYYY.MM.DD. Print output is 1200×1800. Setup and final previews share the export renderer.

Korean lettering uses bundled Noto Sans KR Light (weight 200); date/side text uses bundled Roboto. Font licenses are included in public/fonts. These are close matches, not verified original fonts. Hamu Studio's public website (https://hamustudio.com/) does not supply a complete downloadable frame catalog; the existing other color templates are original app designs, not claimed reproductions of Hamu's collection.
