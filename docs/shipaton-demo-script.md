# Unit Calculator — Silent Demo Script (English captions, under 2 minutes)

## Production specification

The previous version of this script assumed spoken English narration. **The narration audio was lost and no TTS is available for this submission**, so the demo is now a **silent screen recording with on-screen captions only**. No voiceover, no dialogue — captions must carry the full message on their own.

- Format: vertical screen recording of the Android app (portrait), no device frame needed for the on-screen capture itself (a device frame can be added in post if desired for the public video, separately from the raw Play Store screenshot requirement).
- Music: optional restrained ambient/instrumental track, no lyrics, no copyrighted material without a license.
- Captions: burned-in English text overlays, one idea per caption, on screen long enough to read (recommend 2.5–4 seconds per short caption; every caption in this script is on screen for 7 seconds or more).
- Target duration: **under 2 minutes** (this shot list totals **1:53**, leaving a 7-second safety margin). The Shipaton rules have been seen stated as both "under 2 minutes" and "under 3 minutes" in different places — **this is unresolved and flagged as 要確認 in `docs/android-submission-checklist.md`**. This script targets the stricter 2-minute limit so it is safe either way.
- **The recording currently in `submission-assets/demo/unit-calculator-demo-en-silent.webm` does not follow this script.** It was cut from the previous draft, runs **2:30** (540×900, 25 fps) and shows 112 notebooks, so it is both over the 2-minute target and out of date. It has to be re-recorded against the shot list below.
- Capture route used for this repo: `npx expo export --platform web`, serve `dist/` (`python3 -m http.server`), drive it with Chromium at a 540×900 viewport. Dismiss the onboarding modal ("Skip") before the take starts.
- Screen names below use the English UI labels. Note that the tab bar reads **Unit Calculator / Notebooks / Library / Preferences**: the preset notebooks are *browsed and searched* on the **Library** tab, and *opened* on the **Notebooks** tab.
- Each scene below names the exact screen/action to record. Follow `docs/screenshot-capture-plan.md` for how to reach each screen if more detail is needed.

## Shot list and captions

| Time | Screen / action | On-screen caption |
|---|---|---|
| 0:00–0:07 | App opens on the Unit Calculator tab; type `5cm + 1mm` into the expression field | **A calculator that checks your units.** |
| 0:07–0:15 | Hold on the result card, which already shows the value and the SI base line without pressing `=`; let the unit chips under the value be visible | **Every value is normalized to SI — automatically, as you type.** |
| 0:15–0:22 | Press `AC`, type `5m + 1kg`; the dimension-mismatch error appears in place of a result | **Mix incompatible units, and it tells you — instead of a wrong answer.** |
| 0:22–0:31 | Press `AC`, type `100km / 2h`; tap **Compare units** under the result card and let the comparison table expand | **See one result across every compatible unit, at a glance.** |
| 0:31–0:40 | Press `AC`, type `1/3`; the `Decimal` / `Exact` chip pair appears under the unit chips. Tap **Exact** and hold on the typeset fraction (real horizontal bar, KaTeX) | **Not 0.3333… — the answer as an exact fraction.** |
| 0:40–0:50 | Still in `Exact` mode: press `AC`, type `2*pi*50` → shows `100π`; press `AC`, type `sqrt(8)` → shows `2√2`. Hold ~2s on each | **π and roots stay exact, typeset the way you would write them.** |
| 0:50–0:57 | Press `AC`, tap the round `0x` pill at the right-hand end of the unit-suggestion rail under the input; type `FF`; tap `DEC` in the `DEC/BIN/OCT/HEX` bar so the digits become `255` | **Switch a number between decimal, binary, octal, and hex.** |
| 0:57–1:04 | Open the **Library** tab (Notebooks section); slowly scroll the nine category cards (School science, High school physics, Chemistry stoichiometry, Astronomy & space, Electricity & energy, Hobbies & making, Home & everyday life, Physics of cars & bicycles, Mechanical & structural design) | **184 ready-made formula notebooks, in nine categories.** |
| 1:04–1:12 | Tap the "Search all notebooks" field at the top of the Library list and type `photography`; the 7 Photography notebooks appear from wherever you were in the hierarchy | **Search all of them at once — titles, descriptions, even category names.** |
| 1:12–1:21 | Tap "Depth of field (near and far limits)"; the notebook opens on the **Notebooks** tab. Scroll through its typeset formula card and its step results | **Real typeset math, with every step shown — not just the number.** |
| 1:21–1:28 | Preferences → App language: switch English → Japanese → German with fast cuts, showing the same notebook screen re-rendering each time | **Fully translated into six languages.** |
| 1:28–1:38 | Open the Pro screen; show the four feature cards (Ad-free, CSV export, My unit sets, Notebook sharing) and the single purchase button | **One purchase. No subscription, ever.** |
| 1:38–1:45 | Back on the Unit Calculator tab: open the saved-history sheet and scroll it, showing entries beyond the first few | **Full calculation history — free, for everyone, unlimited.** |
| 1:45–1:53 | Closing title card on a plain background | **Unit Calculator — Calculate with confidence, in any compatible unit.** |

Total run time as written: **1:53**, under the 2-minute target.

## Caption style notes

- Keep every caption to one sentence, no more than ~12 words, so it reads comfortably without narration to pace it.
- Do not caption over the exact area of the result card or the input field — keep captions in a consistent band (e.g. top third or bottom third of the screen) so the app UI stays legible. Scenes 0:31–0:50 are the exception to watch: the exact-value chips and the typeset fraction sit right under the value, so the caption must stay in the **top** band for those shots.
- The burned-in caption text must match `submission-assets/demo/demo-captions-en.srt` word for word and frame for frame; that file is the single source of truth for the timing.
- Use the same six-language captions if a translated cut of the video is ever produced, but **for this submission only the English-caption version is required** (per the current scope: Play listing text is localized into 6 languages, but the demo video itself is English-only).

## What changed from the previous draft

- **Added the exact-value display (PR #42) as the centrepiece**, in two scenes (0:31–0:50): `1/3` for the fraction bar and `2*pi*50` / `sqrt(8)` for π and roots. It is the most demo-friendly thing the app does — KaTeX draws a real fraction bar and a real radical sign, which reads instantly in a silent video — so it gets more screen time than any other single feature. The expressions were run through `lib/exact-value.ts` to confirm they really produce `1/3`, `100π` and `2√2`.
- **Added the notebook search scene (1:04–1:12, PR #48).** With 184 notebooks across a two-level hierarchy, "how do I find one" is the obvious question the old shot list left unanswered. `photography` is used because it returns exactly the 7 Photography notebooks purely by matching the *category* name, which demonstrates the feature in one shot.
- **Updated the notebook counts and category names (PR #46)**: 112 → **184** notebooks, and the old nine names (Science / High-school physics / Electricity basics / Astronomy / Fitness / Chemistry / Cars & bikes / Cooking / Materials) → the current nine top-level cards.
- **Corrected the `0x` entry point.** It is no longer a button among the unit controls; it is a round pill at the right-hand end of the unit-suggestion rail (PR #42), and the scene now also shows the base bar re-reading `FF` as `255` rather than just naming the four bases.
- **Removed two scenes to pay for the new ones**, keeping the total under the 2-minute target:
  - **Backup & restore** (was 1:20–1:28) — the least visual moment in the video, a file-export confirmation. It is a reassurance point rather than a selling point, so it belongs in `docs/reviewer-testing-instructions.md`, where judges are explicitly told to use it to confirm nothing is paywalled.
  - **Custom units** (was 0:34–0:44, `shaku` = `0.303m`) — the slowest scene to record, because it needs a round trip into Preferences and text entry inside a modal before anything visible happens. It is still described in the reviewer instructions. **If the final cut comes in short, this is the first scene to add back.**
- **Tightened every retained scene by 1–2 seconds** (the old script gave a flat 8 seconds to captions of very different lengths). Everything else survives: SI normalization, the dimension error, unit comparison, number base, notebooks, six languages, the one-time purchase and unlimited free history.
- Retained from the previous draft: no spoken narration (audio lost, no TTS available), Android-only framing, and the Pro pitch taken verbatim from the four features in `app/(tabs)/pro.tsx`.
