# Shared custom film presets

Film Studio has **Film simulation** (borderless) and **Polaroid** (paper frames, date and optional caption) tabs. They share the uploaded photo and selected grade. Default crop is 4:5.

Choose **Custom**, enter the owner password, upload **Original** and **Goal**, then **Replicate**. The server asks an OpenAI vision model for strictly validated numeric exposure/color/texture settings. The browser renders the result with canvas; no image-generation tool or image-generation endpoint is used. After previewing, enter a name and save. Everyone can use the resulting preset in either tab, including in a fresh browser. Applying a preset makes no additional AI request.

## One-time setup on the existing Cloudflare Pages site

1. In **Supabase → SQL Editor**, run [202611240001_film_presets.sql](../supabase/migrations/202611240001_film_presets.sql). Also run [202611240002_preset_owner_access.sql](../supabase/migrations/202611240002_preset_owner_access.sql) to enable owner login and its attempt limit. These create the shared `film_presets` table, a server-only daily analysis counter and a password-attempt counter. It does not change existing photo storage policies.
2. Create a **Cloudflare Turnstile** widget for the site's hostname. Managed mode is supported.
3. In **Cloudflare Pages → this project → Settings → Variables and Secrets**, add the following **runtime** values (production and any preview environment you want to use):

   | Name | Value | Secret? |
   | --- | --- | --- |
   | `SUPABASE_URL` | Your existing `https://…supabase.co` URL, without backslashes | No |
   | `SUPABASE_SECRET_KEY` | Supabase Secret key beginning `sb_secret_` | **Yes** |
   | `CUSTOM_PRESET_PASSWORD` | Your chosen password for creating custom presets | **Yes** |
   | `OPENAI_API_KEY` | OpenAI project API key with API access/billing | **Yes** |
   | `TURNSTILE_SITE_KEY` | Turnstile widget site key | No |
   | `TURNSTILE_SECRET_KEY` | Turnstile widget secret | **Yes** |
   | `PRESET_DAILY_LIMIT` | Optional: `20` by default, maximum `1000` | No |
   | `OPENAI_PRESET_MODEL` | Optional: `gpt-4.1-mini` by default; must support image inputs and strict structured outputs | No |

   **Never add a `VITE_` prefix to the server secrets.** The existing public `VITE_SUPABASE_*` variables for Remote Duo/photo saves stay as they are. Use the Secret key, not the Publishable key. The older `SUPABASE_SERVICE_ROLE_KEY` variable is still accepted for existing legacy configurations. OpenAI API usage is separately billed; configure the project's API spending controls before enabling public replication.
4. Redeploy from GitHub with the existing `npm run build` / `dist` settings. Cloudflare Pages automatically compiles the root `functions/` directory. This feature needs Pages Functions; uploading only `dist` as static files does not deploy the API. `public/_routes.json` sends only `/api/*` to functions.
5. Test Custom with two non-private sample photos. Save a unique preset name, then open the site in another browser. The named preset should appear there. In Supabase, the numeric settings are under **Table Editor → film_presets**.

Until configured, built-in presets and the two tabs work normally, while Custom displays a setup message and disables paid replication. The browser only receives the public Turnstile site key, numeric settings and a signed draft ticket. The server does not return credentials or upstream error bodies.

## Watermarks and matching limits

The analysis instructions explicitly exclude text, signatures, logos, UI, borders, stickers and watermark shadows/transparency in either reference. On Goal you can additionally drag one or more exclusion rectangles; their normalized coordinates accompany the request. White lettering must not be interpreted as lifted whites, colorful logos as tint, or overlay edges as grain. If too much useful photography is obscured, the server refuses the match and asks for a clearer reference. This is an estimate of a transferable look, not recovery of an unknown application's exact preset. Different subjects, lighting, crops, heavy overlays and local edits limit the match; a clear same-photo before/after pair is best. Watermark detection by the vision model is not guaranteed. The output is global numeric adjustments and cannot reproduce lettering/stickers or remove a watermark from a source photo.

Only the settings and preset name are published. Reference images are resized to at most 1200 pixels for the analysis request; the full-resolution Original is retained locally if used as the editing source. These references are sent to OpenAI with `store:false`, not uploaded to a public preset gallery. This flag does not supersede OpenAI's API data retention policies. Normal Film Studio photos still follow the app's configured session-gallery/cloud archive behavior.

## Protection and validation

- Custom prompts for the password each time it is opened. The password is checked only on the server against `CUSTOM_PRESET_PASSWORD`; it is never embedded in frontend code or returned to visitors.
- Both replication and saving require a signed, one-hour HttpOnly/Secure/SameSite=Strict cookie. Reading and applying existing presets remain public. Changing the password invalidates existing owner cookies. Anyone you share the password with can create presets; this is password-based access, not an account identity check.
- Password attempts are limited to five per IP per 15-minute window with an atomic Supabase RPC. Only a keyed hash of the IP is stored.
- Same-origin JSON requests, capped request/image sizes, bounded settings and strict structured output.
- Turnstile must be verified server-side with the correct hostname/action before any paid call.
- An atomic Supabase RPC caps analysis requests globally per UTC day, including unsuccessful upstream requests. The default is 20 calls/day, not a dollar budget.
- Saving requires an HMAC-signed, one-hour draft ticket. Client-modified settings cannot be published; tickets are idempotent by UUID. No public insert/update/delete policies exist. The site owner can remove unwanted presets through Supabase.
- Originals, goals and credentials are not logged by application code or saved in the shared preset table. Explicit client-side generation/editing of image content is not used.

## Development and verification

`npm run dev` serves the Vite frontend only. To exercise actual function routes locally, build and run `npx wrangler pages dev dist` with the runtime variables in an ignored `.dev.vars` file; configure Turnstile for the local testing hostname. Never commit that file. Deployment credentials are not required for unit/browser tests.

`npm test` verifies numeric grading, bounds, signed drafts, watermark instructions/exclusions, quota/verification gates and settings-only publishing with mocked upstream services. `e2e/custom-presets.spec.ts` verifies the tabs and full upload/mark/replicate/preview/name/save flow plus a separate visitor using a mocked shared service. These checks do not prove live model quality or live database configuration. Disable automatic cloud photo backups for synthetic tests: `VITE_CLOUD_ARCHIVE_ENABLED=false npm run test:e2e -- e2e/custom-presets.spec.ts`.

Implementation references: [OpenAI image analysis](https://developers.openai.com/api/docs/guides/images-vision), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs), [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/), [Turnstile validation](https://developers.cloudflare.com/turnstile/get-started/server-side-validation/).
