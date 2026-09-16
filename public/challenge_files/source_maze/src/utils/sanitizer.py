def sanitize_input(val):
    if not isinstance(val, str):
        return ""
    return val.replace("'", "''").strip()
