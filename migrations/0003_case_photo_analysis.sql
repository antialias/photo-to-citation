CREATE TABLE IF NOT EXISTS case_photo_analysis (
  case_id TEXT NOT NULL,
  url TEXT NOT NULL,
  representation_score REAL NOT NULL,
  highlights TEXT,
  violation INTEGER,
  paperwork INTEGER,
  paperwork_text TEXT,
  paperwork_info TEXT,
  FOREIGN KEY(case_id) REFERENCES cases(id) ON DELETE CASCADE,
  CONSTRAINT case_photo_analysis_pk PRIMARY KEY (case_id, url)
);

