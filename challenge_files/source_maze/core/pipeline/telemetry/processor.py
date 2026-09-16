import os

class TelemetryProcessor:
    def __init__(self):
        self.manifest_dir = os.path.join(os.path.dirname(__file__), "manifest")

    def load_manifest(self):
        target = os.path.join(self.manifest_dir, ".vault_flag.txt")
        if os.path.exists(target):
            with open(target, "r") as f:
                return f.read().strip()
        return None
