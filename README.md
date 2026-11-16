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

4. Redeploy/restart. A small storage note appears beside the upload/room controls; the large top banner has been removed. Test with one photo: the gallery should report **Saved to owner’s private storage**. In Supabase, check **Table Editor → photo_creations** and **Storage → session-photos**.

The public browser key cannot run the SQL migration or enable Anonymous Sign-Ins. Use the dashboard or an authenticated Supabase administration integration for those steps. No secret/service-role key belongs in the frontend.

To verify real saves with labeled synthetic photos, run `VIC_TEST_LIVE_STORAGE=1 VITE_CLOUD_ARCHIVE_ENABLED=true npm run test:e2e -- e2e/cloud-live.spec.ts` with no existing development server on port 5174. This opt-in test uploads through Film Studio and Photobooth, waits for successful cloud saves, reads back the database rows, and downloads the private files to compare their SHA-256 hashes. It leaves the drafts in Storage so you can inspect them; the printed verification report identifies their visitor/session folder. Ordinary tests skip this cloud-writing test.

The private bucket contains binary images; the table stores metadata and image paths. Visitors can upload/read/update only within their own authenticated identity. There is no visitor delete policy for permanent backups. The project owner can inspect and delete backups through the Supabase dashboard. Existing unrelated bucket/table policies were not audited by this migration.

## Session gallery behavior

- Each tab gets a random session ID. Gallery entries survive a refresh and disappear from the visible gallery in a fresh tab. Closing a tab does **not** delete the owner's database copies.
- Browser tab restoration can restore sessionStorage and its prior gallery. Normal new tabs get an empty gallery. IndexedDB entries from earlier sessions are hidden rather than destructively deleting historical photos; they remain on that browser's disk until browser data is cleared. This is a temporary visible gallery, not a promise of secure disk erasure.
- Each uploaded/captured Film Studio original saves immediately. The graded/framed result automatically saves after a one-second pause in editing. Exports update the same creation instead of adding duplicates.
- Local Booth saves each pose immediately and automatically saves the completed strip. Upload **4–8 JPEG/PNG/WebP photos** to create a strip without the camera. Reordering or adjusting the selected four updates the saved strip.
- Remote Duo captures, paired images and finished strips save automatically to the session gallery and, when enabled, the site owner’s private cloud storage. There is no per-photo save confirmation. Both participants see the permanent-storage disclosure before capture. Closing the tab or leaving the room does not erase existing cloud copies.
- Each gallery item reports local-only, pending, saved or failed cloud status. Retry failures before closing the tab. The app warns on tab exit while uploads are pending/failed, subject to browser restrictions. It cannot guarantee uploads after a tab/process closes or when offline; wait for successful status. Pending/failed saves are retried on refresh in the same tab.
- Removing a thumbnail only hides that local item. It does not remove an existing permanent backup. Cloud backups are not publicly browseable or listed in other visitors' galleries.
- With `VITE_CLOUD_ARCHIVE_ENABLED` missing/false, the app uses the session gallery only and explicitly says cloud saving is not enabled.

Image uploads are capped at 20 MB per file by the bucket. Full-resolution originals and rendered copies consume Supabase storage; the free tier has finite storage and request quotas. Quota failures are shown and downloads remain available. Very large images can also exceed browser canvas memory.

## Remote Duo

Use the same Supabase URL and publishable key. Under **Realtime → Settings**, allow public Broadcast channels. No photo data travels through public Broadcast: room topics and AES-GCM signaling keys use separate domain-separated derivations, and video/photos use encrypted WebRTC connections.

Host: Photobooth → Remote Duo → Create room → choose a private join phrase (4–64 characters) or leave blank for a random code → Create and choose strip. Camera permission is requested during room creation so the peers can connect before choosing a strip. Guest chooses Join room and enters the same code, or follows the invitation link. After connection, the host selects frame, layout and 4/6/8 poses. The guest sees those choices and the same frame preview. The host continues to cameras; both mark ready; host starts. Settings use acknowledged revisions: changing an option clears both ready states and shooting is blocked until the latest options are acknowledged. Each pose has its own seven-second countdown. The host schedules a shared timestamp; seven clock probes select a low-RTT clock offset. Selection and ordering synchronize through the peer data channel.

Random room codes contain 96 random bits plus a timestamp. Custom codes are normalized to lowercase, turn spaces into hyphens and require 4–64 letters/numbers/hyphens/underscores. They act as the room password; short/common codes such as poop are guessable, so use a unique private phrase when privacy matters. Custom signaling uses PBKDF2-SHA256 (210,000 iterations) with distinct key/topic material. Rooms expire an hour after host creation; guests use the expiry advertised by the host. Conflicting hosts are detected with encrypted presence probes, which are best-effort signaling rather than an atomic server reservation. Links put the room code in the URL fragment. Share links privately. Public Broadcast still permits project-quota abuse by people with the public key; client encryption is not server-side rate limiting.

For restricted networks, configure a TURN relay with `VITE_TURN_URL`, `VITE_TURN_USERNAME`, and `VITE_TURN_CREDENTIAL`. These frontend values are visible; use short-lived TURN credentials, never a permanent privileged secret. STUN alone does not connect every pair of networks.

A disconnect cancels active shooting. Both participants should leave the room and create/join a new room. A refreshed host should create a new room and share its link. Hidden tabs cancel countdowns because browser background timing cannot be trusted.

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

Four-cut recreates the supplied brown LIFEFOURCUTS/인생네컷 reference at 528×1584 per strip. **Two strips** places the host’s four photos in the left strip and the guest’s four photos in the right strip. **Two matching strips** duplicates the paired side-by-side rows in both columns. With one camera, the separate-strip layout repeats the same camera’s photos. Remote participant order is host-first on both devices. Dates use the current browser-local YYYY.MM.DD; print output is 1200×1800.

Bundled Noto Sans KR (weight 200) and Roboto are close lettering matches, not verified originals; licenses are in `public/fonts`. Hamu Studio's public site does not provide a complete downloadable frame catalog. Other frame colors are original app templates.

Landscape preview: [Unsplash source](https://images.unsplash.com/photo-1470252649378-9c29740c9fa8). Cat previews reuse the supplied Mimicams assets. Preview artwork is never substituted for captured session photos. UI fonts use Google Fonts with system fallbacks.

### Remote Duo verification

Verified with the configured live Supabase Broadcast service and two local headless Chrome contexts using real WebRTC and synthetic MediaDevices streams: custom-code create/join, shared frame/layout/6-pose choices, guest read-only controls, camera-stage transitions, acknowledged settings and readiness resets, duplicate-host rejection, and a complete synchronized six-pose session. Both peers received all six paired captures and generated identical final strip pixels. Remote captures and the completed strip were automatically added to each tab’s session gallery; cloud photo uploads are blocked by the live capture test.

To rerun the capture check explicitly: `VIC_TEST_LIVE_CAPTURE=1 npm run test:e2e -- --grep "live remote six-pose"`. This takes about 60 seconds. It captures synthetic peer images into the session gallery and blocks cloud auth/storage requests so synthetic photos are not permanently uploaded. Physical cameras, separate devices, restricted networks and TURN remain separate deployment checks. No additional room SQL migration is required.

## Reference frame presets

Photobooth includes Borderless, Borderless Duo, Sepia Six-cut, Pink Gingham, Cozy Doodles, Autumn Bears, Black Contact Sheet, Pink Six-cut, Heart Sketch, Pink Crumb, Star Buddies, Honey Bears and Cherry Blossom. These are editable vector recreations inspired by the supplied borders; character illustrations and lettering are approximations. Presets appear in setup and the review Paper menu and are included in previews, downloads and automatic saves. Decoration assets contain no example people or photos.

Pink Six-cut, Heart Sketch, Pink Crumb and Sepia Six-cut use six distinct selected poses and automatically require at least six captures. Their default layout is a 2 × 3 sheet. Sepia Six-cut also applies the adjustable Sepia filter. Borderless Duo defaults to one four-photo column per participant, with no border or footer. Star Buddies uses cream paper, yellow stars and chef/baker character ornaments. Black Contact Sheet defaults to a 2 × 2 sheet. Other reference borders default to the current strip layout. Matching copies repeat the same selected photos; separate strips use each participant's own photos. Remote Duo shares the preset, capture count and selection with the guest. Refresh both peers after deployment for the updated frame protocol.

## Camera backgrounds and capture screen

Before shooting, choose Original, White, Cream, Pink, Blue, Green or a custom solid color under Camera background. The host’s choice synchronizes to the guest. Person segmentation runs locally with MediaPipe’s bundled Selfie Segmenter Landscape model; no external image-processing API is used. The composited canvas stream is sent through WebRTC and used for captures, so the peer preview and saved shot include the background. Camera background applies to live input. In review, Photo background also replaces the background of already-taken or uploaded photos and is included in previews, automatic saves and exports. The selected solid color is composited after film grading, so White remains white.

Model and WASM assets are served from this app; the segmentation SDK is lazy loaded. Deployment headers permit WebAssembly compilation. First use downloads the runtime and may take a moment. Until a replacement is ready, the compositor hides the real background behind a solid color; readiness stays disabled. On failure, choose Original to recover. Hair, motion and lighting can affect cutout quality, and inference has a device-dependent CPU cost. The camera track is composited at up to 20 fps.

Every pose has a scheduled seven-second countdown, with a two-second preview between poses. During shooting, the UI shows only equal-sized remote camera views and one shared timer; setup controls and save prompts are hidden. Press Escape to cancel if necessary. Controls return before capture and in review. Automatic saving remains subject to the cloud setup, upload completion and quota limits above.

Sources: [MediaPipe Image Segmenter](https://developers.google.com/edge/mediapipe/solutions/vision/image_segmenter), [selfie model](https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter_landscape/float16/1/selfie_segmenter_landscape.tflite). The MediaPipe license is bundled in public/models. The foreground-preservation test uses a public [Unsplash portrait](https://images.unsplash.com/photo-1494790108377-be9c29b29330), stored only as a test fixture.

### Countdown version compatibility

Capture plans carry a protocol identifier, a seven-second duration and every absolute pose deadline. The host uses the same plan it sends; guests apply clock offset compensation to all deadlines. Setup acknowledgements must match the protocol before readiness/capture is allowed. An older peer gets a persistent refresh/rejoin warning instead of running different timing. HTML entry points revalidate cache, while hashed assets remain immutable. After deploying this update, both participants must refresh their tabs and create/join a fresh room.

## Review and returning to a room

The exported photostrip is the central review display. Retake photos stack in one scrollable column and use the same graded image/crop renderer as the exported windows. An enlarged pose appears below the strip; choose Enlarge beside a pose to inspect its filter. On mobile, the strip and large pose come first, followed by editing controls and the pose list.

Go back to room keeps the existing WebRTC connection, room code and host/guest roles. Either person can return first while their partner finishes editing. The host can begin another round once both are back. Edit last strip reopens the preserved review. Starting the next round creates a fresh round ID and gallery creation; late photos/readiness messages from the previous round are ignored. Existing gallery creations remain saved.

For live privacy, choose Your camera background before creating/joining the room. This overrides the shared room background for that participant and is also available beside the idle camera controls. Your partner receives the composited stream. Photo background in review changes finished photos; it cannot undo an earlier live view or remove original captures already saved in the gallery/cloud.

### Film Studio camera

New Film Studio edits default to a 4:5 photo crop. Existing saved edits retain their chosen ratio. Use camera → Start 7-second timer captures a real camera photo after seven seconds and automatically saves its original and edited creation. Cancel timer or Escape stops the countdown; hiding the tab cancels it too. The live camera viewport follows the selected ratio, while Original shows the native camera framing.
