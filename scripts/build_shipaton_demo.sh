#!/usr/bin/env bash
set -euo pipefail

ROOT="/home/ubuntu/si-unit-calculator"
ASSETS="$ROOT/submission-assets"
WORK="$ASSETS/demo-work"
mkdir -p "$WORK"

build_clip() {
  local image="$1"
  local duration="$2"
  local fade_start="$3"
  local output="$4"
  ffmpeg -y -loop 1 -framerate 30 -t "$duration" -i "$image" \
    -vf "scale=-2:1920,pad=1080:1920:(ow-iw)/2:(oh-ih)/2:color=0xF7F9FA,fade=t=in:st=0:d=0.5,fade=t=out:st=$fade_start:d=0.5,format=yuv420p" \
    -r 30 -c:v libx264 -preset medium -crf 19 -pix_fmt yuv420p "$output"
}

build_clip "$ASSETS/unit-calculator-shipaton-calculation-1179x2556.png" 28 27.5 "$WORK/01-calculation.mp4"
build_clip "$ASSETS/unit-calculator-shipaton-samples-1179x2556.png" 22 21.5 "$WORK/02-samples.mp4"
build_clip "$ASSETS/unit-calculator-shipaton-pro-1179x2556.png" 22 21.5 "$WORK/03-pro.mp4"
build_clip "$ASSETS/unit-calculator-shipaton-calculation-1179x2556.png" 14.4 13.9 "$WORK/04-closing.mp4"

cat > "$WORK/concat.txt" <<EOF
file '$WORK/01-calculation.mp4'
file '$WORK/02-samples.mp4'
file '$WORK/03-pro.mp4'
file '$WORK/04-closing.mp4'
EOF

ffmpeg -y -f concat -safe 0 -i "$WORK/concat.txt" -i "$ASSETS/unit-calculator-pro-demo-narration.wav" \
  -map 0:v:0 -map 1:a:0 -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart \
  "$ASSETS/unit-calculator-pro-shipaton-demo-en.mp4"

ffprobe -v error -show_entries stream=codec_type,width,height:format=duration -of default=noprint_wrappers=1 \
  "$ASSETS/unit-calculator-pro-shipaton-demo-en.mp4"
