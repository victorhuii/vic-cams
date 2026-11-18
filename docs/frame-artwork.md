# Original frame artwork

The raster overlays in `public/frames/originals/` retain artwork pixels from the source images listed in their `manifest.json`. These replace the hand-drawn approximations for Star Buddies, Honey Bears, Cozy Doodles, Pink Six-cut and Heart Sketch. Additional original designs are Pancake Bears, Love Cats, Flower Pups, Picnic Bear, Cloud Friends 10th, Photoism Witch and Photoism Pumpkin.

Photos are cropped to the measured source windows, then the transparent PNG is drawn on top. Characters, lettering, patterns and ornaments can overlap photos. Filters and background replacement affect the photos before the artwork is composited. Matching copies duplicate the result; separate strips render each participant behind the same original art. Old printed dates are removed and the current browser-local date is drawn in that space. Original logos and artist credits are retained where present.

Source images are compressed finished photo strips or public previews, not original layered production files. The masks preserve the visible source artwork; fine JPEG edges may retain slight halos. Transparent pixels have their RGB channels zeroed, so the sample photographs are not hidden in shipped PNGs. These files are not described as open source or assigned a new license.

## Reproduce extraction

With Pillow, NumPy and SciPy installed:

```sh
python3 scripts/extract-frame-art.py --source-dir /private/tmp/victor-pin-frames --download
```

The script downloads missing source images only with `--download`. Originals and color-test proofs stay outside the repository. It writes the PNG overlays, provenance manifest and `src/features/booth/originalFrames.ts`. The source photo rectangles, artwork masks and date areas are recorded in the script. Review the generated proofs before changing a mask.

## Additional searches

- [Hamu Studio](https://hamustudio.com/): checked its public site and Pinterest/image searches; no downloadable catalog of blank Hamu frames was found. Do not label unrelated Life4Cuts or Haru Film artwork as Hamu Studio.
- [Official Photoism × Amuroki preview](https://x.com/photoism_kr/status/1967438228287627481): source of the Witch and Pumpkin overlays, four photo windows each.
- [Official Photoism × PpomPpom Black Kitsch preview](https://x.com/photoism_kr/status/1883688879376486708): located for further review; not added because the promotional preview uses three photo windows and needs separate layout work.
- The exact original Autumn Bears, Cherry Blossom and Pink Crumb artwork was not among the supplied Pinterest links. Those existing illustrated presets remain unchanged; they are not presented as extracted originals.
