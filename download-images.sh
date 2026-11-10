#!/usr/bin/env bash
# Downloads every image the site uses from mkurugenzi.ke into ./images,
# keeping the same folder structure. Afterwards, open js/data.js and change
#   const IMG = "https://mkurugenzi.ke/wp-content/uploads/";
# to
#   const IMG = "images/";
set -euo pipefail
cd "$(dirname "$0")"
BASE="https://mkurugenzi.ke/wp-content/uploads/"
while read -r path; do
  [ -z "$path" ] && continue
  mkdir -p "images/$(dirname "$path")"
  echo "Downloading $path"
  curl -fsSL "$BASE$path" -o "images/$path"
done <<'LIST'
2024/04/black-1-of-1-2048x2048.png
2026/09/9.png
2026/08/2-3.png
2026/09/12.png
2026/09/3.png
2026/09/a.png
2026/09/b.png
2026/08/379-scaled.jpg
2026/11/Coffe-Brown-Splatter-768x960.png
2026/11/black-tshirt-patch-768x960.png
2026/11/white-tshirt-patch-768x960.png
2026/11/black-top-768x960.png
2026/11/white-top-768x960.png
2026/11/MK-Muse-Coffee-Brown-768x960.png
2026/10/Botanical-white-819x1024.png
2026/10/Botanical-Dark-Burgundy-819x1024.png
2026/10/Botanical-Black-819x1024.png
2026/01/black-tshirt-2-819x1024.webp
2026/01/Desert-Taupe-Tshirt-819x1024.webp
2026/01/tshirt-navy-bluer-1-819x1024.webp
2026/01/Beige-Tshirt-819x1024.webp
2026/01/White-tshirt-819x1024.webp
2026/01/Burgundy-Tshirt-819x1024.webp
2026/10/Black-Excellence-819x1024.png
2026/10/Charcoal-grey-819x1024.png
2026/10/Desert-Sand-819x1024.png
2026/08/290-731x1024.jpg
2026/08/342-732x1024.jpg
2026/08/309-732x1024.jpg
2026/08/395-731x1024.jpg
2026/08/512-731x1024.jpg
2026/08/476-732x1024.jpg
2026/08/458-683x1024.jpg
2026/08/237-1-731x1024.jpg
2026/08/122-1-1-683x1024.jpg
2026/10/cap-1-819x1024.png
2026/10/cap-3-819x1024.png
2026/10/cap-2-819x1024.png
2026/02/Tote-Resized-819x1024.png
2026/09/87047815-30b6-46c8-881f-30520e5d72ea-1-683x1024.png
LIST
echo "Done. Now set IMG = \"images/\" in js/data.js"
