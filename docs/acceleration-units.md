# 加速度単位の実装メモ

## 対応単位

| 入力記号 | 意味 | SI換算値 |
| --- | --- | --- |
| `m/s²` | メートル毎秒毎秒 | `1 m/s²` |
| `Gal` | ガル（地球物理・測地分野の加速度単位） | `0.01 m/s²` |
| `mGal` | ミリガル | `1×10⁻⁵ m/s²` |
| `µGal` | マイクロガル | `1×10⁻⁸ m/s²` |
| `G` / `g0` | 標準重力 | `9.80665 m/s²` |

> `Gal` の正式な単位記号は大文字で始まるため、本アプリでは加速度として `Gal` を用いる。小文字の `gal` は既存の米液量ガロンと区別する必要がある。単位検索では `gal` と入力しても、加速度の `Gal (gal)` を見つけられる。

標準重力は正確に `9.80665 m/s²` であり、1 `Gal` は `10⁻² m/s²` である。[1] [2]

## 入力例

```text
1G → Gal          # 980.665 Gal
1000mGal → Gal    # 1 Gal
2kg × 1G → N      # 19.6133 N
```

## References

[1]: https://physics.nist.gov/cgi-bin/cuu/Value?gn "NIST — Standard acceleration of gravity"
[2]: https://www.bipm.org/documents/20126/41483022/SI-Brochure-9-EN.pdf/2d2b50bf-f2b4-9661-f402-5f9d66e4b507?version=1.9&download=true "BIPM — The International System of Units (SI), 9th edition"
