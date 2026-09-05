# Unit Calculator — Silent Demo Script (English captions, under 2 minutes)

## Production specification

The previous version of this script assumed spoken English narration. **The narration audio was lost and no TTS is available for this submission**, so the demo is now a **silent screen recording with on-screen captions only**. No voiceover, no dialogue — captions must carry the full message on their own.

- Format: vertical screen recording of the Android app (portrait), no device frame needed for the on-screen capture itself (a device frame can be added in post if desired for the public video, separately from the raw Play Store screenshot requirement).
- Music: optional restrained ambient/instrumental track, no lyrics, no copyrighted material without a license.
- Captions: burned-in English text overlays, one idea per caption, on screen long enough to read (recommend 2.5–4 seconds per short caption).
- Target duration: **under 2 minutes** (aim for ~100–110 seconds to leave a safety margin). The Shipaton rules have been seen stated as both "under 2 minutes" and "under 3 minutes" in different places — **this is unresolved and flagged as 要確認 in `docs/android-submission-checklist.md`**. This script targets the stricter 2-minute limit so it is safe either way.
- Each scene below names the exact screen/action to record. Follow `docs/screenshot-capture-plan.md` for how to reach each screen if more detail is needed.

## Shot list and captions

| Time | Screen / action | On-screen caption |
|---|---|---|
| 0:00–0:08 | App opens on the calculator tab; type `5cm + 1mm` | **A calculator that checks your units.** |
| 0:08–0:16 | Result card appears in real time (before pressing `=`), showing SI base value and unit chips | **Every value is normalized to SI — automatically, as you type.** |
| 0:16–0:24 | Replace the expression with `5m + 1kg`; the dimension-mismatch error appears | **Mix incompatible units, and it tells you — instead of a wrong answer.** |
| 0:24–0:34 | Enter `100km / 2h`; tap "Compare units" to expand the comparison table | **See one result across every compatible unit, at a glance.** |
| 0:34–0:44 | Open Settings → Custom units; add symbol `shaku` with definition `0.303m`; return to the calculator and use it in an expression | **Define your own units — like shaku = 0.303m.** |
| 0:44–0:52 | Clear the expression, tap the `0x` rail button, enter a hex value; show the DEC/BIN/OCT/HEX display chips | **Switch a number between decimal, binary, octal, and hex.** |
| 0:52–1:04 | Library tab: scroll the category grid (Science, High-school physics, Electricity basics, Astronomy, Fitness, Chemistry, Cars & bikes, Cooking, Materials), then open a notebook with real typeset math | **112 formula notebooks — from elementary science to engineering — with real, typeset math.** |
| 1:04–1:12 | Inside the notebook, scroll a step chain showing a result symbol equation (e.g. `F = m·a`) | **Steps chain together, so you can see the "why," not just the number.** |
| 1:12–1:20 | Settings → Language: switch between English, Japanese, Spanish, Portuguese (Brazil), German, French quickly (fast cuts) | **Fully translated into six languages.** |
| 1:20–1:28 | Settings → Backup & restore: export notebooks/constants/custom units | **Back up your notebooks, constants, and custom units.** |
| 1:28–1:40 | Pro screen: show the four feature cards (Ad-free, CSV export, My unit sets, Notebook sharing) and the one-time purchase button | **One purchase. No subscription, ever.** |
| 1:40–1:48 | Calculator tab: show full, unbounded history list scrolling | **Full calculation history — free, for everyone, unlimited.** |
| 1:48–1:56 | Closing title card on a plain background | **Unit Calculator — Calculate with confidence, in any compatible unit.** |

Total run time as written: **~1:56**, under the 2-minute target.

## Caption style notes

- Keep every caption to one sentence, no more than ~12 words, so it reads comfortably without narration to pace it.
- Do not caption over the exact area of the result card or the input field — keep captions in a consistent band (e.g. top third or bottom third of the screen) so the app UI stays legible.
- Use the same six-language captions if a translated cut of the video is ever produced, but **for this submission only the English-caption version is required** (per the current scope: Play listing text is localized into 6 languages, but the demo video itself is English-only).

## What changed from the previous draft

- Removed reliance on spoken narration (audio lost, no TTS available) — the whole script is now silent + captions.
- Removed the outdated "CSV / unit set only" Pro pitch and iPhone-oriented framing; replaced with the current feature set (notebooks, unit comparison, custom units, number base, 6 languages, backup, free unlimited history) verified against `CLAUDE.md`'s work history and `app/(tabs)/pro.tsx`.
- Removed the 1179×2556px (iPhone) production spec; this submission targets Android only.
