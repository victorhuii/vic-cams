# Import a custom film preset

Open Film Studio → Custom, enter the owner password, and copy the ChatGPT prompt. In ChatGPT, attach Original and Goal reference photos with that prompt. Download the resulting Markdown settings file, upload it to Custom, inspect the preview, name it and save. Only the owner password can authorize new presets; everyone can apply existing presets. No OpenAI API key, API billing or Turnstile configuration is needed for this flow.

The Markdown must contain exactly one fenced `json` block with `format: "victor-film-preset-v1"`, an optional `name`, and all supported numeric `settings`. The provided prompt contains the complete schema, value limits and renderer equations, including instructions to ignore watermarks and avoid promising exact recovery of unknown settings. Files are limited to 256 KB. The server validates the file again before publishing. Markdown is parsed as settings, never executed or rendered as HTML.

## Evoto color charts

Custom also offers two chart downloads under **Extract an Evoto filter**:
- `public/preset-tools/evoto-chart-a.png`: standard identity Hald level 8, 512×512, 64×64×64 RGB samples, red varies fastest.
- `public/preset-tools/evoto-chart-b.png`: the same samples with the linear pixel positions cyclically shifted by 131072 pixels (256 rows). This is a companion recovery chart, not a standard identity Hald by itself.

Apply exactly the same Evoto filter/settings to both. Disable auto exposure/white balance, subject/face adjustments, grain, sharpening, local edits, vignette and blur for chart extraction. Export unresized, uncropped 512×512 sRGB PNGs. Return both processed files in this chat for extraction. Watermarked samples must be excluded, including translucent fringes; the shifted chart can supply unobscured duplicate colors. If both occurrences are covered, those colors require interpolation or another export. Arbitrary watermarks cannot be guaranteed recoverable. A chart captures a global color transformation, not retouching, spatial effects or texture.

Extracted LUTs can be embedded in the same Markdown `settings.lut` object as `{size:33,data:"..."}`. Size must be an integer from 2 to 33; data is base64 RGB8 bytes, exactly `size³ × 3`, red varying fastest. The canvas applies trilinear interpolation, then the numeric adjustments, and blends the whole grade with the source according to intensity. ChatGPT should not invent LUT samples from photos; chart extraction is a separate deterministic calculation. Actual Evoto exports have not yet been provided or verified.

## Server setup

Retain these Cloudflare runtime variables:
- `SUPABASE_URL`: your project HTTPS URL.
- `SUPABASE_SECRET_KEY`: server Secret key, stored as a Secret. The legacy `SUPABASE_SERVICE_ROLE_KEY` fallback remains supported.
- `CUSTOM_PRESET_PASSWORD`: the owner's chosen password, stored as a Secret.

Run both Supabase migrations: `202611240001_film_presets.sql` and `202611240002_preset_owner_access.sql`. The existing setup is sufficient; no additional migration is required for Markdown or LUT imports. Publish the root `functions/` through Cloudflare Pages Git deployment, not only the static `dist/` folder. The old replication API now returns 410 after authorization and makes no paid requests. Old OpenAI/Turnstile environment variables are unused by the import flow and may be removed.

The password is verified server-side and authorizes a one-hour HttpOnly/Secure/SameSite cookie. Password attempts are limited to five per IP per 15 minutes using hashed IP buckets in Supabase. Both creating a preset and importing settings require this access; reading existing presets is public. Anyone with the owner password can create presets. Use the Supabase dashboard to remove unwanted presets.

Supabase stores preset names and numeric/LUT settings only. Normal photo gallery uploads continue to follow the site's existing storage configuration.
