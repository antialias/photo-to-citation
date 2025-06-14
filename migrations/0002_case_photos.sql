CREATE TABLE IF NOT EXISTS case_photos (
  case_id TEXT NOT NULL,
  url TEXT NOT NULL,
  taken_at TEXT,
  gps_lat REAL,
  gps_lon REAL,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT case_photos_pk PRIMARY KEY (case_id, url)
);

INSERT INTO case_photos (case_id, url, taken_at, gps_lat, gps_lon)
SELECT
  c.id,
  p.value,
  json_extract(c.data, '$.photoTimes.' || json_quote(p.value)),
  json_extract(c.data, '$.photoGps.' || json_quote(p.value) || '.lat'),
  json_extract(c.data, '$.photoGps.' || json_quote(p.value) || '.lon')
FROM cases c, json_each(c.data, '$.photos') p;

UPDATE cases
SET data = json_remove(json_remove(json_remove(data, '$.photos'), '$.photoTimes'), '$.photoGps');
