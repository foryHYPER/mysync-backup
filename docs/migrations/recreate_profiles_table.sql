-- Recreate profiles table after accidental deletion

-- 0. Create the update trigger function (if it doesn't exist)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 1. Create the profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin','company','candidate')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Create the update trigger
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 3. Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY profiles_admin ON profiles FOR ALL 
    USING (auth.jwt() ->> 'role' = 'admin')
    WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY profiles_self_select ON profiles FOR SELECT 
    USING (auth.uid() = id);

CREATE POLICY profiles_self_insert ON profiles FOR INSERT 
    WITH CHECK (auth.uid() = id);

CREATE POLICY profiles_self_update ON profiles FOR UPDATE 
    USING (auth.uid() = id) 
    WITH CHECK (auth.uid() = id);

-- 5. Grant permissions
GRANT ALL ON profiles TO authenticated;
GRANT ALL ON profiles TO service_role;

-- Note: After running this, you may need to re-insert profile records
-- for existing auth.users entries. You can do this with:
-- 
-- INSERT INTO profiles (id, role) 
-- SELECT id, 'candidate' -- or 'company' or 'admin' as appropriate
-- FROM auth.users 
-- WHERE id NOT IN (SELECT id FROM profiles); 