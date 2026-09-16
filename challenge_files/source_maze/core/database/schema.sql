CREATE TABLE IF NOT EXISTS telemetry_records (
    record_id TEXT PRIMARY KEY,
    timestamp INTEGER,
    sensor_id TEXT,
    payload_hash TEXT
);
