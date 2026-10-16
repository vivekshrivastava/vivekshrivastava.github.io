#!/usr/bin/env bash
# Launch test: installs the release build on an emulator, opens it, taps through
# a few screens and fails if the app crashes. Screenshots are saved to $2.
set -uo pipefail
APK="$1"
OUT="$2"
PKG="in.vivekshrivastava.lawfirm"
mkdir -p "$OUT"

shot() { adb exec-out screencap -p > "$OUT/$1.png"; }
ui() { adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb shell cat /sdcard/ui.xml > "$OUT/ui.xml" 2>/dev/null; }
# Tap the centre of the first on-screen element whose text contains $1.
tap_text() {
  ui
  local b
  b=$(grep -o "text=\"[^\"]*$1[^\"]*\"[^>]*bounds=\"\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]\"" "$OUT/ui.xml" | head -1 | grep -o 'bounds="[^"]*"' | grep -o '[0-9]\+')
  if [ -z "$b" ]; then echo "::warning::Could not find '$1' on screen"; return 1; fi
  set -- $b
  adb shell input tap $(( ($1 + $3) / 2 )) $(( ($2 + $4) / 2 ))
  sleep 4
}
alive() { adb shell pidof "$PKG" >/dev/null || { echo "::error::App is not running after: $1"; adb logcat -d > "$OUT/logcat.txt"; exit 1; }; }

adb install -r "$APK" || { echo "::error::Install failed"; exit 1; }
adb logcat -c
adb shell am start -W -n "$PKG/.MainActivity"

# The app must report that its page loaded (logged by MainActivity) within 90 seconds.
loaded=""
for i in $(seq 1 45); do
  sleep 2
  if adb logcat -d -s "VivekanandLaw:V" | grep -q "Page loaded"; then loaded=yes; break; fi
  if adb logcat -d -s "VivekanandLaw:V" | grep -q "Page failed"; then break; fi
done
sleep 8
shot 1-first-launch
alive "launch"
adb logcat -d -s "VivekanandLaw:V" > "$OUT/app-log.txt"
cat "$OUT/app-log.txt"
if [ -z "$loaded" ]; then echo "::error::The app's page did not finish loading"; exit 1; fi
if grep -q "JS ERROR" "$OUT/app-log.txt"; then echo "::error::JavaScript error in the app"; exit 1; fi

tap_text "I agree" && shot 2-home
alive "accepting disclaimer"
tap_text "Store" && shot 3-store
tap_text "Add to cart" && shot 4-added-to-cart
tap_text "Services" && shot 5-services
adb shell input keyevent 4; sleep 3; shot 6-after-back
alive "navigation and back button"

adb logcat -d > "$OUT/logcat.txt"
if grep -q "FATAL EXCEPTION" "$OUT/logcat.txt"; then echo "::error::App crashed"; exit 1; fi
adb logcat -d -s "VivekanandLaw:V" > "$OUT/app-log.txt"
if grep -q "JS ERROR" "$OUT/app-log.txt"; then echo "::error::JavaScript error in the app"; cat "$OUT/app-log.txt"; exit 1; fi
echo "Launch test passed"
