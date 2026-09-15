from __future__ import annotations

import os
import unittest
from unittest.mock import patch

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "mouher_backend.settings")

import django

django.setup()

from services.backend.commerce.notifications import detect_browser, loyalty_push_config


class NotificationTests(unittest.TestCase):
    def test_detect_browser_identifies_chrome_and_safari(self):
        self.assertEqual(detect_browser("Mozilla/5.0 Chrome/140 Safari/537.36"), "Chrome")
        self.assertEqual(detect_browser("Mozilla/5.0 Version/17 Safari/605.1.15"), "Safari")

    def test_loyalty_push_config_reports_public_key_availability(self):
        def fake_setting(name, default):
            if name == "MOUHER_WEB_PUSH_VAPID_PUBLIC_KEY":
                return "public-key"
            return default

        with patch("commerce.notifications.get_setting", side_effect=fake_setting):
            config = loyalty_push_config()

        self.assertEqual(config["enabled"], True)
        self.assertEqual(config["public_key"], "public-key")
        self.assertIn("Chrome", config["supported_browsers"])
        self.assertIn("Safari", config["supported_browsers"])


if __name__ == "__main__":
    unittest.main()
