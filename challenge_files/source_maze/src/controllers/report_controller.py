class ReportController:
    def __init__(self, db_conn):
        self.db = db_conn

    def get_summary(self):
        return {"reports_count": 12, "last_audit": "2026-09-14"}
