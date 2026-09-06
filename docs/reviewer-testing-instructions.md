# Judge / Reviewer Testing Instructions (English)

This document is written for Shipaton judges and Google Play reviewers who need to verify both the free experience and the Pro (one-time purchase) features without paying.

## 1. Getting the app

- Install Unit Calculator from the Google Play Store listing link provided in the submission.
- The app works fully offline after install; no account or sign-in is required.

## 2. Trying the free experience

Everything below is available with no purchase:

- Enter a mixed-unit expression such as `5cm + 1mm` or `100N / 0.01m^2` on the Calculator tab and see the result normalize to SI units in real time.
- Try an intentionally invalid expression such as `5m + 1kg` to see the dimension-mismatch error.
- Tap "Compare units" under a result to expand the full unit-comparison table.
- **Exact values (fractions, π, √).** Type an expression whose answer is not a whole number and look just under the unit chips on the result card: when an exact form exists, a `Decimal` / `Exact` chip pair appears. Tap `Exact` to see the answer typeset by KaTeX (a real fraction bar, a real radical sign). Expressions that are guaranteed to show it:
  - `1/3` → 1/3, and `10/4` → 5/2 (fractions are reduced)
  - `2*pi*50` → 100π
  - `sqrt(8)` → 2√2 (square factors are pulled out)
  - `atan(1)` → π/4
  - By design the chips **do not appear** when the answer is already a whole number — try `3+5` to confirm nothing is added (the app never shows a toggle that would do nothing).
  - Copying the result while `Exact` is selected copies the same notation you see on screen, not the decimal.
- Open the Library tab to browse **184 preset formula notebooks** in nine top-level categories — School science, High school physics, Chemistry stoichiometry, Astronomy & space, Electricity & energy, Hobbies & making, Home & everyday life, Physics of cars & bicycles, and Mechanical & structural design (38 categories in total, counting sub-categories) — each rendered with real typeset math. Tapping a notebook opens it on the Notebooks tab.
- **Searching the notebooks.** The Library tab has a search field ("Search all notebooks") above the list. It matches titles, descriptions **and category names** across the whole two-level hierarchy, so you do not have to remember where a notebook lives. Things to try:
  - `photography` — returns the 7 notebooks of the Photography category even though none of them has that word in its title (category-name matching).
  - `torque`, `coffee`, `solar` — each returns matches pulled from several different categories at once.
  - `photography depth` — space-separated words are ANDed, narrowing to a single notebook.
  - Clearing the search field returns you to exactly the category level you were browsing before, so searching never loses your place.
- Open Settings → Custom units (the settings tab is labelled **Preferences** in English) to define your own unit, either as a multiple (e.g. `shaku` = `0.303m`) or as a formula (for units with an offset, like a temperature scale).
- Enter a plain number (no unit) and tap the round `0x` pill at the **right-hand end of the unit-suggestion rail** (below the input field) to type in binary, octal, or hexadecimal; the `DEC`/`BIN`/`OCT`/`HEX` bar that appears switches base without discarding what you typed (`FF` in hex becomes `255` in decimal). For a decimal whole-number result, the same four chips appear under the result card to re-read the answer in another base.
- Some presets open with defaults chosen for your region: mains voltage and breaker ratings are resolved from the device region (100V in Japan, 120V in North America, 230V/16A elsewhere) and prices from the device currency, so a notebook starts from a value that is plausible where the reviewer is (`lib/preset-regional-defaults.ts`).
- Open Settings → Language to confirm the app is fully translated into English, Japanese, Spanish, Portuguese (Brazil), German, and French — including unit names, error messages, and every preset notebook.
- Your calculation history is unlimited for free users; it is never trimmed or gated.
- Settings → Backup & restore lets you export your notebooks, global constants, and custom units to a file and re-import them (useful to confirm nothing is silently paywalled).

## 3. Verifying Pro (one-time purchase, no subscription)

Unit Calculator Pro unlocks four things (see `app/(tabs)/pro.tsx`):

1. An ad-free experience (the free version shows banner ads only — never full-screen ads).
2. CSV export of your calculation history.
3. Your own saved unit sets, for faster entry of frequently used units.
4. Sharing a notebook as a formatted document you can print or save as PDF.

There is no free trial for Pro (Google Play does not support trials on one-time, non-subscription purchases), so judges should use one of the two methods below instead of paying.

### Android: promo / offer code

- Provide judges with a promo or offer code configured in Google Play Console / RevenueCat for the one-time Pro product, so they can unlock Pro without paying.
- **提出前に人間が用意する作業**: the actual promo code, and the exact redemption steps for this specific Play Console product, still need to be generated and tested end-to-end before this section can be considered final. Insert the real code and redemption URL/steps here once available.

<!-- TODO: Insert the generated Google Play promo/offer code and the exact redemption steps once RevenueCat/Play Console configuration is finalized. -->

### Web: hidden Pro preview

The web build of the app has a hidden way to preview Pro features, so judges/reviewers can see Pro without needing an Android purchase flow.

- **Enable**: visit the web build with `?pro=preview` appended to the URL — for example `https://ohru131.github.io/si-unit-calculator/?pro=preview` (**提出前に人間が確認する作業**: replace this URL with the actual hosted web build URL used for this submission, if different). The preview state is persisted (AsyncStorage), so reloading afterward without the query parameter keeps the preview on.
- **Disable**: visit the same URL with `?pro=off` appended.
- **Alternate UI entry point**: on the Settings tab, tap the "Region" row 7 times within 2 seconds to toggle the preview on/off.
- **Web-only, by design**: the preview mechanism is gated on `Platform.OS === "web"` in three places (the restore effect's early return, `setProPreviewEnabled`'s final guard, and `resolveInitialProPreview`'s return value), so it can never be enabled on the iOS/Android build. The Android build's Pro status always comes from the real RevenueCat entitlement check, unaffected by this mechanism.
- While the preview is active, the Pro screen always shows a banner warning that this is not a real purchase ("Pro preview is on — this is not a real purchase.").
- This is for judge/reviewer verification only, not a general public feature.

## 4. What NOT to expect

- No subscription options exist anywhere in the app (by design — see `docs/market-research-2026-09.md` section 4 on why this genre reacts strongly against subscriptions).
- No free trial for the one-time Pro purchase (not supported by app stores for non-consumable products).
- No iOS build is part of this submission; this round targets Google Play only.
