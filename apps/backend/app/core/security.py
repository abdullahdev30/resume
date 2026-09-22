from secrets import compare_digest


def secure_compare(left: str, right: str) -> bool:
    return compare_digest(left, right)
