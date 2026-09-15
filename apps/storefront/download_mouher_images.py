from pathlib import Path
import hashlib
import json
import mimetypes
import re

from playwright.sync_api import sync_playwright


SOURCE_URL = "https://mouher.com/"

OUTPUT_DIR = Path("public/mouher-images")
MANIFEST_FILE = Path("public/mouher-images.json")

# Ignore tiny icons, tracking pixels, etc.
MIN_WIDTH = 200
MIN_HEIGHT = 200


def extension_from_content_type(content_type: str) -> str:
    content_type = content_type.lower().split(";")[0].strip()

    mapping = {
        "image/jpeg": ".jpg",
        "image/jpg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
        "image/avif": ".avif",
        "image/gif": ".gif",
    }

    return mapping.get(
        content_type,
        mimetypes.guess_extension(content_type) or ".bin",
    )


def clean_filename(url: str, index: int, content_type: str) -> str:
    extension = extension_from_content_type(content_type)

    filename = Path(url.split("?")[0]).name

    if not filename or "." not in filename:
        filename = f"mouher-{index:03d}{extension}"

    filename = re.sub(
        r"[^a-zA-Z0-9._-]",
        "-",
        filename,
    )

    return filename


def main():
    OUTPUT_DIR.mkdir(
        parents=True,
        exist_ok=True,
    )

    images = []

    with sync_playwright() as p:

        browser = p.chromium.launch(
            headless=True
        )

        page = browser.new_page(
            viewport={
                "width": 1920,
                "height": 1080,
            },
            device_scale_factor=1,
        )

        print(
            f"Opening Mouher homepage: {SOURCE_URL}"
        )

        responses = []

        def handle_response(response):
            try:
                content_type = response.headers.get(
                    "content-type",
                    "",
                )

                if not content_type.startswith(
                    "image/"
                ):
                    return

                responses.append(response)

            except Exception:
                pass

        page.on(
            "response",
            handle_response,
        )

        page.goto(
            SOURCE_URL,
            wait_until="networkidle",
            timeout=60_000,
        )

        # Give lazy-loaded images time to appear.
        page.wait_for_timeout(3000)

        # Scroll through the page so lazy-loaded
        # product images are requested.
        for _ in range(8):
            page.mouse.wheel(
                0,
                1000,
            )

            page.wait_for_timeout(500)

        page.wait_for_timeout(2000)

        print(
            f"Found {len(responses)} image requests."
        )

        seen_urls = set()

        for index, response in enumerate(
            responses,
            start=1,
        ):

            url = response.url

            if url in seen_urls:
                continue

            seen_urls.add(url)

            try:
                body = response.body()

                if len(body) < 10_000:
                    continue

                content_type = response.headers.get(
                    "content-type",
                    "",
                )

                filename = clean_filename(
                    url,
                    index,
                    content_type,
                )

                # Prevent duplicate filenames.
                file_hash = hashlib.md5(
                    body
                ).hexdigest()[:8]

                stem = Path(filename).stem
                suffix = Path(filename).suffix

                filename = (
                    f"{stem}-{file_hash}{suffix}"
                )

                output_path = (
                    OUTPUT_DIR / filename
                )

                output_path.write_bytes(body)

                images.append(
                    {
                        "src": f"/mouher-images/{filename}",
                        "originalUrl": url,
                    }
                )

                print(
                    f"Downloaded: {filename}"
                )

            except Exception as error:
                print(
                    f"Skipped {url}: {error}"
                )

        browser.close()

    # Remove duplicates based on local path.
    unique_images = []

    seen = set()

    for image in images:

        if image["src"] in seen:
            continue

        seen.add(image["src"])
        unique_images.append(image)

    MANIFEST_FILE.write_text(
        json.dumps(
            unique_images,
            indent=2,
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    print()
    print(
        f"Downloaded {len(unique_images)} images."
    )

    print(
        f"Images: {OUTPUT_DIR}"
    )

    print(
        f"Manifest: {MANIFEST_FILE}"
    )


if __name__ == "__main__":
    main()