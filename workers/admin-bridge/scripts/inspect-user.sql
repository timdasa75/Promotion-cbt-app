SELECT email, role, plan, status, email_verified, legacy_provider, length(password_hash) AS hash_len, substr(password_hash,1,40) AS hash_prefix, updated_at
FROM auth_users
WHERE email = 'timdasa75@gmail.com';
