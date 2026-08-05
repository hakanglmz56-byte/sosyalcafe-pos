import json
import difflib
import re
import urllib.request
from html import unescape

GOPOS_URL = "https://sosyalcafe.gopos.com.tr"
MENU_URL = "https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com/menu_v7.json"
PATCH_URL = "https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com/menu_v7.json"


def fetch(url):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", errors="ignore")


def clean_text(v):
    v = re.sub(r"<[^>]*>", " ", v)
    v = unescape(v)
    v = re.sub(r"\s+", " ", v).strip()
    return v


def norm(v):
    v = clean_text(v).lower()
    tr_map = str.maketrans({"ı": "i", "ş": "s", "ğ": "g", "ü": "u", "ö": "o", "ç": "c", "İ": "i"})
    v = v.translate(tr_map)
    # Drop decorative chars around names and normalize separators.
    v = re.sub(r"[()\[\]{}]", " ", v)
    v = re.sub(r"[^a-z0-9+\s]", " ", v)
    v = re.sub(r"\s*\+\s*", " + ", v)
    # Handle noisy OCR/typing variants from legacy sources (e.g. redbull/redbul, ayran/ayrann).
    v = re.sub(r"([a-z])\1+", r"\1", v)
    v = re.sub(r"\s+", " ", v).strip()
    return v


def parse_gopos_map(html):
    pat = re.compile(
        r'<div\s+id="urunkart-\d+"\s+class="urun-card"[\s\S]*?<img[^>]+src="([^"]+)"[\s\S]*?<h3>\s*([\s\S]*?)\s*</h3>',
        re.I,
    )
    out = {}
    for m in pat.finditer(html):
        src = m.group(1).strip()
        title = clean_text(m.group(2))
        if not title:
            continue
        full = src if src.startswith("http") else GOPOS_URL + src
        out[norm(title)] = full
    return out


def main():
    gopos_html = fetch(GOPOS_URL)
    menu_raw = fetch(MENU_URL)
    menu = json.loads(menu_raw or "{}")

    gopos_map = parse_gopos_map(gopos_html)
    gopos_names = list(gopos_map.keys())

    updates = {}
    matched = 0
    unmatched = []

    for key, item in menu.items():
        name = str(item.get("name", ""))
        name_norm = norm(name)
        img = gopos_map.get(name_norm)
        if not img and name_norm:
            # Conservative fuzzy fallback for near-identical legacy spellings.
            best = difflib.get_close_matches(name_norm, gopos_names, n=1, cutoff=0.88)
            if best:
                img = gopos_map.get(best[0])
        if img:
            updates[f"{key}/image"] = img
            updates[f"{key}/img"] = img
            matched += 1
        else:
            unmatched.append(name or key)

    print(f"GoPOS parsed: {len(gopos_map)}")
    print(f"Menu items: {len(menu)}")
    print(f"Matched: {matched}")
    print(f"Unmatched: {len(unmatched)}")

    if not updates:
        print("No updates generated.")
        return

    data = json.dumps(updates, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        PATCH_URL,
        data=data,
        headers={"Content-Type": "application/json"},
        method="PATCH",
    )
    with urllib.request.urlopen(req, timeout=40) as r:
        _ = r.read()

    with open("/tmp/menu_image_unmatched.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(unmatched))

    print("Firebase image patch applied.")


if __name__ == "__main__":
    main()
