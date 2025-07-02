INSERT INTO casbin_rules (ptype, v0, v1, v2) VALUES
  ('p', 'anonymous', 'oauth_providers', 'read'),
  ('p', 'superadmin', 'oauth_providers', 'update');
