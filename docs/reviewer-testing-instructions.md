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
- Open the Library tab to browse 112+ preset formula notebooks (elementary/middle-school science, high-school physics, everyday electricity/driving cost estimates, astronomy, fitness, chemistry, cars & bikes, cooking, and materials engineering), each rendered with real typeset math.
- Open Settings → Custom units to define your own unit, either as a multiple (e.g. `shaku` = `0.303m`) or as a formula (for units with an offset, like a temperature scale).
- Enter a plain number (no unit) and use the `0x` button next to the input to switch between decimal, binary, octal, and hexadecimal.
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

### Web: hidden Pro preview (in progress)

A separate, concurrent engineering effort is adding a hidden way to preview Pro features on the web build of the app, specifically so judges/reviewers can see Pro without needing an Android purchase flow. The activation mechanism is **not finalized yet** at the time of writing this document.

<!-- TODO: 発動方法を実装確定後に記入（Web版の隠しProプレビュー機能。別セッションが実装中で、有効化の具体的な手順は未確定）。 -->

Once finalized, this section should state:
- The exact URL/steps to enable the Pro preview on the web build.
- Confirmation that the web preview never affects the Android/Play Store build's real entitlement checks (it is web-only by design).
- A note that this is for judge/reviewer verification only, not a general public feature.

## 4. What NOT to expect

- No subscription options exist anywhere in the app (by design — see `docs/market-research-2026-09.md` section 4 on why this genre reacts strongly against subscriptions).
- No free trial for the one-time Pro purchase (not supported by app stores for non-consumable products).
- No iOS build is part of this submission; this round targets Google Play only.
