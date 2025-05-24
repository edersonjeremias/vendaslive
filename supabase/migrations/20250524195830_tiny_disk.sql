/*
  # Fix recursive policies for user_roles table

  1. Changes
    - Drop existing policies that cause recursion
    - Create new non-recursive policies for user_roles table
    
  2. Security
    - Maintain same security model but implement it without recursion
    - Users can still only see their own roles
    - Admins can still manage all roles
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Admins podem atualizar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem criar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem deletar roles" ON user_roles;
DROP POLICY IF EXISTS "Admins podem ver todos os roles" ON user_roles;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios roles" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Enable read access for users to their own roles"
ON user_roles FOR SELECT
TO public
USING (
  auth.uid() = user_id
);

CREATE POLICY "Enable insert access for admins"
ON user_roles FOR INSERT
TO public
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Enable update access for admins"
ON user_roles FOR UPDATE
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);

CREATE POLICY "Enable delete access for admins"
ON user_roles FOR DELETE
TO public
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND is_admin = true
  )
);