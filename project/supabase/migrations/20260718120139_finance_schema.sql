/*
# Finance Intelligence Platform Schema

## Overview
Creates the full data model for a personal finance & expense intelligence app:
expenses, income, budgets, and AI-generated insights. Each table is owner-scoped
to the authenticated user via `user_id` with `DEFAULT auth.uid()` so client
inserts that omit the owner still satisfy RLS.

## New Tables
1. `expenses` — individual expense transactions
   - id (uuid pk)
   - user_id (uuid, owner, default auth.uid())
   - amount (numeric, > 0)
   - category (text)
   - description (text, optional notes)
   - date (date)
   - created_at (timestamptz)
2. `income` — income transactions
   - id (uuid pk)
   - user_id (uuid, owner, default auth.uid())
   - amount (numeric, > 0)
   - source (text)
   - description (text, optional)
   - date (date)
   - created_at (timestamptz)
3. `budgets` — monthly category budgets (limit_amount column, since `limit` is reserved)
   - id (uuid pk)
   - user_id (uuid, owner, default auth.uid())
   - category (text)
   - limit_amount (numeric, > 0)
   - month (text, YYYY-MM format)
   - created_at (timestamptz)
4. `insights` — AI-generated financial insights
   - id (uuid pk)
   - user_id (uuid, owner, default auth.uid())
   - type (text: categorization|prediction|anomaly|recommendation|coach)
   - title (text)
   - body (text)
   - severity (text: info|warning|positive)
   - metadata (jsonb)
   - read (boolean, default false)
   - created_at (timestamptz)

## Security
- RLS enabled on every table.
- 4 owner-scoped policies (select/insert/update/delete) per table, scoped TO authenticated.
- `user_id` defaults to auth.uid() so inserts without an explicit owner succeed.

## Notes
1. Indexes added on (user_id, date) for expenses/income and (user_id, month) for budgets.
2. Unique constraint on (user_id, category, month) for budgets to prevent dupes.
3. All numeric columns use numeric(12,2) for currency precision.
4. Budget limit column named `limit_amount` because `limit` is a SQL reserved word.
*/

CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  category text NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON expenses(user_id, date);

DROP POLICY IF EXISTS "select_own_expenses" ON expenses;
CREATE POLICY "select_own_expenses" ON expenses FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_expenses" ON expenses;
CREATE POLICY "insert_own_expenses" ON expenses FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_expenses" ON expenses;
CREATE POLICY "update_own_expenses" ON expenses FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_expenses" ON expenses;
CREATE POLICY "delete_own_expenses" ON expenses FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  source text NOT NULL,
  description text,
  date date NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE income ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_income_user_date ON income(user_id, date);

DROP POLICY IF EXISTS "select_own_income" ON income;
CREATE POLICY "select_own_income" ON income FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_income" ON income;
CREATE POLICY "insert_own_income" ON income FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_income" ON income;
CREATE POLICY "update_own_income" ON income FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_income" ON income;
CREATE POLICY "delete_own_income" ON income FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL,
  limit_amount numeric(12,2) NOT NULL CHECK (limit_amount > 0),
  month text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, category, month)
);
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_budgets_user_month ON budgets(user_id, month);

DROP POLICY IF EXISTS "select_own_budgets" ON budgets;
CREATE POLICY "select_own_budgets" ON budgets FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_budgets" ON budgets;
CREATE POLICY "insert_own_budgets" ON budgets FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_budgets" ON budgets;
CREATE POLICY "update_own_budgets" ON budgets FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_budgets" ON budgets;
CREATE POLICY "delete_own_budgets" ON budgets FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('categorization','prediction','anomaly','recommendation','coach')),
  title text NOT NULL,
  body text NOT NULL,
  severity text NOT NULL DEFAULT 'info' CHECK (severity IN ('info','warning','positive')),
  metadata jsonb DEFAULT '{}'::jsonb,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_insights_user_created ON insights(user_id, created_at DESC);

DROP POLICY IF EXISTS "select_own_insights" ON insights;
CREATE POLICY "select_own_insights" ON insights FOR SELECT
  TO authenticated USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "insert_own_insights" ON insights;
CREATE POLICY "insert_own_insights" ON insights FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "update_own_insights" ON insights;
CREATE POLICY "update_own_insights" ON insights FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "delete_own_insights" ON insights;
CREATE POLICY "delete_own_insights" ON insights FOR DELETE
  TO authenticated USING (auth.uid() = user_id);
