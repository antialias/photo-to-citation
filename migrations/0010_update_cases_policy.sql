DELETE FROM casbin_rules WHERE ptype='p' AND v0='user' AND v1='cases' AND v2='read';
INSERT INTO casbin_rules (ptype, v0, v1, v2)
  VALUES ('p', 'anonymous', 'public_cases', 'read');
