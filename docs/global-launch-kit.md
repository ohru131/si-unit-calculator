# Unit Calculator — Global Launch Kit

## Product positioning

**Unit Calculator** is an offline-first dimensional calculator for students, engineers, makers, and field teams. It converts every expression to SI units before calculation, then presents the result in a compatible unit selected by the user. The first release supports English and Japanese, with Metric, US customary, and Imperial / UK display presets.

## English store listing draft

| Field | Draft copy |
|---|---|
| App name | Unit Calculator |
| Subtitle | Calculate dimensions with confidence |
| Promotional text | Mix units, calculate in SI, and display results your way. |
| Short description | A dimensional calculator for length, speed, pressure, energy, power, and more. |

### Full description

Unit Calculator makes everyday technical calculations easier to verify. Enter expressions such as `5cm + 1mm`, `100N ÷ 0.01m²`, or `1mi ÷ 1h`. The app normalizes values to SI units before calculating, so mixed-unit expressions stay dimensionally correct.

Choose Metric, US customary, or Imperial / UK preferences to prioritize familiar units. Convert compatible results to metres, feet, miles per hour, pascals, psi, joules, BTU, watts, horsepower, Celsius, Fahrenheit, and more. Save reusable constants, start from guided examples, and keep a local calculation history. Unit Calculator Pro adds unlimited history, CSV export, and a personal unit set.

## Internationalization checklist

| Area | Release action | Owner decision required |
|---|---|---|
| In-app language | Ship English and Japanese; use the Settings tab to override device detection. | Select the next language after observing store conversion and retention. |
| Regional units | Validate Metric, US customary, and Imperial / UK defaults with target users. | Decide whether Canada should default to Metric while exposing US customary as an option. |
| Store metadata | Add localized English/Japanese descriptions, screenshots, and in-app product text. | Supply final localized screenshots captured from release builds. |
| Support | Publish a monitored support contact and response-time policy. | Choose the business email/domain before store submission. |
| Privacy | Host the final privacy policy at a public URL; disclose local storage and RevenueCat purchase processing. | Confirm legal entity, contact address, and deletion-request channel. |
| Pricing | Use RevenueCat's localized purchase sheet and configure territory pricing in each store. | Choose launch price, trial terms, and eligible territories. |

## Privacy and support disclosure draft

> Unit Calculator stores saved constants, preferences, and calculation history locally on the device. Purchase status is processed by RevenueCat and the applicable app store. Before publication, replace this draft with a public privacy policy that identifies the data controller, support contact, retention terms, and the applicable storefront privacy disclosures.

## Accessibility release checks

The app uses descriptive labels for key controls and respects the system text-size setting. Before release, test VoiceOver on iOS and TalkBack on Android, including language selection, region presets, calculation, conversion, purchase, restore, and CSV export. Verify that each tap target remains usable at large text sizes and that values are not conveyed by color alone.

## References

[1]: https://developer.apple.com/localization/ "Apple Developer — Localization"

[2]: https://support.google.com/googleplay/android-developer/answer/9844778?hl=en "Google Play Console Help — Translate and localize your app"
