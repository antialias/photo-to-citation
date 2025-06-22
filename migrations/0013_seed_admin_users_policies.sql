DELETE FROM casbin_rules;

INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES
  ('p', 'anonymous', 'public_cases', 'read'),
  ('p', 'user', 'upload', 'create'),
  ('p', 'user', 'cases', 'read'),
  ('p', 'user', 'cases', 'update'),
  ('p', 'user', 'cases', 'delete'),
  ('p', 'user', 'snail_mail_providers', 'read'),
  ('p', 'user', 'vin_sources', 'read'),
  ('p', 'admin', 'admin', 'read'),
  ('p', 'admin', 'admin', 'update'),
  ('p', 'admin', 'users', 'create'),
  ('p', 'admin', 'users', 'read'),
  ('p', 'admin', 'users', 'update'),
  ('p', 'admin', 'users', 'delete'),
  ('p', 'admin', 'cases', 'update'),
  ('p', 'admin', 'cases', 'delete'),
  ('p', 'admin', 'snail_mail_providers', 'update'),
  ('p', 'admin', 'vin_sources', 'update'),
  ('p', 'superadmin', 'superadmin', 'update'),
  ('g', 'admin', 'user', NULL),
  ('g', 'superadmin', 'admin', NULL);
