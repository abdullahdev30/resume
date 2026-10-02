import re


E164_PHONE_PATTERN = re.compile(r"^\+[1-9]\d{7,14}$")


def normalize_phone_number(value: str, default_calling_code: str = "92") -> str:
    """Normalize common international and Pakistan-local phone input to E.164."""
    normalized = re.sub(r"[\s().-]", "", value.strip())
    if normalized.startswith("00"):
        normalized = f"+{normalized[2:]}"
    elif normalized.startswith("0"):
        normalized = f"+{default_calling_code}{normalized[1:]}"
    elif normalized.isdigit():
        normalized = f"+{normalized}"

    if not E164_PHONE_PATTERN.fullmatch(normalized):
        raise ValueError("Phone number must be a valid international number in E.164 format.")
    return normalized
