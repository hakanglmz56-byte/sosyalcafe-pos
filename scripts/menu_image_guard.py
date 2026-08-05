#!/usr/bin/env python3
import argparse
import json
import subprocess
import sys
import urllib.request
from datetime import datetime
from pathlib import Path

MENU_URL = "https://cafe-adisyon-2bcf0-default-rtdb.firebaseio.com/menu_v7.json"


def fetch_menu():
    req = urllib.request.Request(MENU_URL, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as resp:
        return json.loads(resp.read().decode("utf-8") or "{}")


def image_stats(menu):
    qr_visible_items = [
        item
        for item in menu.values()
        if not (item.get("hiddenInQr") is True or str(item.get("hiddenInQr", "")).lower() == "true")
    ]
    total = len(qr_visible_items)
    with_image = sum(1 for item in qr_visible_items if (item.get("image") or item.get("img") or "").strip())
    return total, with_image, total - with_image


def backup_images(menu, backup_dir):
    backup_dir.mkdir(parents=True, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d_%H%M%S")
    out = backup_dir / f"menu_v7_images_{ts}.json"

    payload = {
        "createdAt": datetime.now().isoformat(timespec="seconds"),
        "menuCount": len(menu),
        "images": {
            key: {
                "name": item.get("name", ""),
                "category": item.get("category", ""),
                "image": (item.get("image") or "").strip(),
                "img": (item.get("img") or "").strip(),
                "hiddenInQr": item.get("hiddenInQr", False),
            }
            for key, item in menu.items()
        },
    }

    out.write_text(json.dumps(payload, ensure_ascii=False, indent=2), encoding="utf-8")
    return out


def run_restore_script(script_path):
    proc = subprocess.run(
        [sys.executable, str(script_path)],
        capture_output=True,
        text=True,
        check=False,
    )
    return proc.returncode, proc.stdout, proc.stderr


def main():
    parser = argparse.ArgumentParser(description="Backup and auto-restore menu images when they are missing.")
    parser.add_argument(
        "--backup-dir",
        default="backups/menu-images",
        help="Directory to store image backups (default: backups/menu-images)",
    )
    parser.add_argument(
        "--min-coverage",
        type=float,
        default=0.95,
        help="Minimum required image coverage ratio before triggering restore (default: 0.95)",
    )
    parser.add_argument(
        "--force-restore",
        action="store_true",
        help="Run restore script regardless of coverage",
    )
    args = parser.parse_args()

    project_root = Path(__file__).resolve().parents[1]
    backup_dir = (project_root / args.backup_dir).resolve()
    restore_script = (project_root / "scripts" / "restore_images_from_gopos.py").resolve()

    menu = fetch_menu()
    total, with_image, missing = image_stats(menu)
    coverage = (with_image / total) if total else 1.0

    backup_file = backup_images(menu, backup_dir)
    print(f"Backup written: {backup_file}")
    print(f"Image coverage: {with_image}/{total} ({coverage:.1%}), missing: {missing}")

    should_restore = args.force_restore or (total > 0 and coverage < args.min_coverage)
    if not should_restore:
        print("Coverage threshold satisfied, restore skipped.")
        return 0

    print("Coverage below threshold, running restore script...")
    code, out, err = run_restore_script(restore_script)
    if out.strip():
        print(out.strip())
    if err.strip():
        print(err.strip(), file=sys.stderr)

    if code != 0:
        print("Restore script failed.", file=sys.stderr)
        return code

    menu_after = fetch_menu()
    total2, with_image2, missing2 = image_stats(menu_after)
    coverage2 = (with_image2 / total2) if total2 else 1.0
    print(f"Post-restore coverage: {with_image2}/{total2} ({coverage2:.1%}), missing: {missing2}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
