class SessionValidator:
    def __init__(self, token):
        self.token = token
    def is_active(self):
        return self.token is not None and len(self.token) > 20
