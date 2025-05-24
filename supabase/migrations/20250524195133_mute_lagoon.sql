/*
  # Adicionar suporte a roles e permissões de usuário

  1. Novas Tabelas
    - `user_roles`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `is_admin` (boolean)
      - `permissions` (jsonb)
      - `created_at` (timestamp)

  2. Segurança
    - Enable RLS na tabela user_roles
    - Adicionar políticas para controle de acesso
*/

-- Criar tabela de roles de usuário
CREATE TABLE IF NOT EXISTS user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  permissions JSONB NOT NULL DEFAULT '{
    "canViewClients": true,
    "canCreateClients": false,
    "canEditClients": false,
    "canDeleteClients": false,
    "canViewSales": true,
    "canCreateSales": false,
    "canEditSales": false,
    "canDeleteSales": false
  }'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Políticas para user_roles
CREATE POLICY "Usuários podem ver seus próprios roles"
  ON user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os roles"
  ON user_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins podem criar roles"
  ON user_roles FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins podem atualizar roles"
  ON user_roles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

CREATE POLICY "Admins podem deletar roles"
  ON user_roles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND is_admin = true
    )
  );

-- Função para definir o primeiro usuário como admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_roles LIMIT 1) THEN
    -- Primeiro usuário é admin
    INSERT INTO user_roles (user_id, is_admin, permissions)
    VALUES (
      NEW.id,
      true,
      '{
        "canViewClients": true,
        "canCreateClients": true,
        "canEditClients": true,
        "canDeleteClients": true,
        "canViewSales": true,
        "canCreateSales": true,
        "canEditSales": true,
        "canDeleteSales": true
      }'::jsonb
    );
  ELSE
    -- Usuários subsequentes não são admin
    INSERT INTO user_roles (user_id, is_admin, permissions)
    VALUES (NEW.id, false, DEFAULT);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para novos usuários
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();