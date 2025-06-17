INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES
  ('p', 'user', 'cases', 'read'),
  ('p', 'user', 'cases', 'update'),
  ('p', 'user', 'cases', 'delete'),
  ('p', 'user', 'upload', 'create'),
  ('g', 'admin', 'user', NULL),
  ('g', 'superadmin', 'admin', NULL);
