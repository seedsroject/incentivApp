-- 019_is_admin_rpc.sql
-- RPC to check if an email belongs to an administrator (role = 'ADMIN') pre-login

CREATE OR REPLACE FUNCTION is_admin_email(p_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_is_admin BOOLEAN;
BEGIN
  -- Check if the email exists in profiles and has role = 'ADMIN' in user_project_access
  -- Or if it's the super admin email
  IF LOWER(TRIM(p_email)) = 'admin.geral@formandocampeoes.org.br' THEN
    RETURN TRUE;
  END IF;

  SELECT EXISTS (
    SELECT 1 
    FROM profiles p
    JOIN user_project_access upa ON p.id = upa.user_id
    WHERE LOWER(p.email) = LOWER(TRIM(p_email)) 
      AND upa.role = 'ADMIN'
  ) INTO v_is_admin;
  
  RETURN COALESCE(v_is_admin, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
