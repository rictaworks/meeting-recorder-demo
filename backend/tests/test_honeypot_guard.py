import pytest
from app.services.honeypot_guard import HoneypotGuard


def test_empty_honeypot_field_not_bot():
    guard = HoneypotGuard()
    assert guard.check("") is False


def test_none_honeypot_field_not_bot():
    guard = HoneypotGuard()
    assert guard.check(None) is False


def test_filled_honeypot_field_is_bot():
    guard = HoneypotGuard()
    assert guard.check("I am a bot") is True


def test_whitespace_honeypot_field_is_not_bot():
    guard = HoneypotGuard()
    assert guard.check("   ") is False
