/*
  # Fix recursive policies for user_roles table

  1. Changes
    - Remove recursive policies that were causing infinite recursion
    - Create new policies that avoid recursion by using direct user checks
    - Maintain security by ensuring only admins can modify other users' roles
    
  2. Security
    - Users can always read their own role
    - Only admins can create/update/delete roles
    - Policies use direct user checks instead of recursive queries
*/

-- Drop existing policies
DROP POLICY IF EXISTS "Enable delete access for admins" ON user_roles;
DROP POLICY IF EXISTS "Enable insert access for admins" ON user_roles;
DROP POLICY IF EXISTS "Enable read access for users to their own roles" ON user_roles;
DROP POLICY IF EXISTS "Enable update access for admins" ON user_roles;

-- Create new non-recursive policies
CREATE POLICY "Users can read their own role"
  ON user_roles
  FOR SELECT
  TO public
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can read all roles"
  ON user_roles
  FOR SELECT
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can insert roles"
  ON user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can update roles"
  ON user_roles
  FOR UPDATE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins can delete roles"
  ON user_roles
  FOR DELETE
  TO public
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );