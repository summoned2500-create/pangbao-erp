-- ============================================================
-- 胖寶餃子 ERP — 成本分析模組 SQL 設定
-- 執行環境：Supabase SQL Editor
-- 建立時間：2026-09-05
-- ============================================================

-- 1. 食材資料表
CREATE TABLE IF NOT EXISTS ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  unit text NOT NULL DEFAULT 'g',          -- g, kg, 顆, 張, 包, ml, L
  price_per_unit numeric(10,4) NOT NULL DEFAULT 0,
  last_purchase_price numeric(10,4),
  last_purchase_date date,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 產品資料表
CREATE TABLE IF NOT EXISTS products (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  category text DEFAULT 'dumpling',        -- dumpling / other
  unit_count integer NOT NULL DEFAULT 20,  -- 每包顆數
  sale_price numeric(10,2) NOT NULL DEFAULT 0,
  is_frozen boolean DEFAULT true,
  is_active boolean DEFAULT true,
  note text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. 產品配方（BOM）
CREATE TABLE IF NOT EXISTS product_ingredients (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid REFERENCES products(id) ON DELETE CASCADE,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE CASCADE,
  quantity_per_unit numeric(10,4) NOT NULL,  -- 每「顆」用量（單位同 ingredients.unit）
  note text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(product_id, ingredient_id)
);

-- 4. 每日產量記錄
CREATE TABLE IF NOT EXISTS daily_production (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  date date NOT NULL UNIQUE,
  total_units integer NOT NULL DEFAULT 700,
  note text,
  created_at timestamptz DEFAULT now()
);

-- 5. 進貨記錄
CREATE TABLE IF NOT EXISTS ingredient_purchases (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ingredient_id uuid REFERENCES ingredients(id) ON DELETE SET NULL,
  date date NOT NULL DEFAULT CURRENT_DATE,
  quantity numeric(10,3) NOT NULL,
  unit_price numeric(10,4) NOT NULL,
  total_amount numeric(10,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  note text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- updated_at 自動更新 Trigger
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_ingredients_updated_at
  BEFORE UPDATE ON ingredients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 進貨後自動同步 ingredients.price_per_unit
-- ============================================================
CREATE OR REPLACE FUNCTION sync_ingredient_price_after_purchase()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE ingredients
  SET
    price_per_unit      = NEW.unit_price,
    last_purchase_price = NEW.unit_price,
    last_purchase_date  = NEW.date,
    updated_at          = now()
  WHERE id = NEW.ingredient_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_ingredient_purchases_sync
  AFTER INSERT ON ingredient_purchases
  FOR EACH ROW EXECUTE FUNCTION sync_ingredient_price_after_purchase();

-- ============================================================
-- RLS（與 transactions 一致：anon 可讀寫）
-- ============================================================
ALTER TABLE ingredients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients  ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_production     ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_purchases ENABLE ROW LEVEL SECURITY;

-- ingredients
CREATE POLICY "anon can select ingredients"
  ON ingredients FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert ingredients"
  ON ingredients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update ingredients"
  ON ingredients FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can delete ingredients"
  ON ingredients FOR DELETE TO anon USING (true);

-- products
CREATE POLICY "anon can select products"
  ON products FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert products"
  ON products FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update products"
  ON products FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can delete products"
  ON products FOR DELETE TO anon USING (true);

-- product_ingredients
CREATE POLICY "anon can select product_ingredients"
  ON product_ingredients FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert product_ingredients"
  ON product_ingredients FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update product_ingredients"
  ON product_ingredients FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can delete product_ingredients"
  ON product_ingredients FOR DELETE TO anon USING (true);

-- daily_production
CREATE POLICY "anon can select daily_production"
  ON daily_production FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert daily_production"
  ON daily_production FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update daily_production"
  ON daily_production FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can delete daily_production"
  ON daily_production FOR DELETE TO anon USING (true);

-- ingredient_purchases
CREATE POLICY "anon can select ingredient_purchases"
  ON ingredient_purchases FOR SELECT TO anon USING (true);
CREATE POLICY "anon can insert ingredient_purchases"
  ON ingredient_purchases FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "anon can update ingredient_purchases"
  ON ingredient_purchases FOR UPDATE TO anon USING (true) WITH CHECK (true);
CREATE POLICY "anon can delete ingredient_purchases"
  ON ingredient_purchases FOR DELETE TO anon USING (true);

-- ============================================================
-- 驗證（執行後應該看到 5 個資料表）
-- ============================================================
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'ingredients','products','product_ingredients',
    'daily_production','ingredient_purchases'
  )
ORDER BY table_name;
