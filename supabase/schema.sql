-- ============================================================
-- FINANZAS PERSONALES — Schema inicial de Supabase
-- ============================================================

-- 1. HOUSEHOLDS (permite compartir la cuenta con tu pareja)
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Mi hogar',
  created_at timestamptz not null default now()
);

create table household_members (
  household_id uuid references households(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null default 'member', -- 'owner' | 'member'
  primary key (household_id, user_id)
);

-- 2. CATEGORIES & SUBCATEGORIES
create type category_type as enum ('ingreso', 'gasto');

create table categories (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  type category_type not null,
  icon text,              -- nombre de icono lucide-react
  color text,             -- hex para gráficos
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table subcategories (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references categories(id) on delete cascade,
  name text not null,
  sort_order int not null default 0
);

-- 3. TRANSACTIONS
create type currency_code as enum ('USD', 'VES');

create table transactions (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  category_id uuid not null references categories(id),
  subcategory_id uuid references subcategories(id),
  amount numeric(14,2) not null check (amount > 0),
  currency currency_code not null default 'USD',
  exchange_rate numeric(14,4), -- tasa BCV al momento (si currency = VES, o si querés registrar la referencia igual en USD)
  amount_usd numeric(14,2) not null, -- monto normalizado a USD, calculado en la app al insertar
  description text,
  date date not null default current_date,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create index idx_transactions_household_date on transactions(household_id, date desc);
create index idx_transactions_category on transactions(category_id);

-- 4. SAVINGS GOALS
create table savings_goals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  name text not null,
  target_amount numeric(14,2) not null,
  current_amount numeric(14,2) not null default 0,
  currency currency_code not null default 'USD',
  target_date date,
  created_at timestamptz not null default now()
);

-- 5. EXCHANGE RATE CACHE (para no golpear la API en cada carga)
create table exchange_rate_snapshots (
  id uuid primary key default gen_random_uuid(),
  rate numeric(14,4) not null,
  source text not null default 'BCV',
  fetched_at timestamptz not null default now()
);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
alter table households enable row level security;
alter table household_members enable row level security;
alter table categories enable row level security;
alter table subcategories enable row level security;
alter table transactions enable row level security;
alter table savings_goals enable row level security;

create policy "members can see their household"
  on households for select
  using (id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can see their membership rows"
  on household_members for select
  using (user_id = auth.uid() or household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can manage categories"
  on categories for all
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can manage subcategories"
  on subcategories for all
  using (category_id in (
    select id from categories where household_id in (
      select household_id from household_members where user_id = auth.uid()
    )
  ));

create policy "members can manage transactions"
  on transactions for all
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

create policy "members can manage goals"
  on savings_goals for all
  using (household_id in (select household_id from household_members where user_id = auth.uid()));

-- ============================================================
-- SEED: categorías iniciales basadas en tu Excel
-- (reemplazá :household_id por el id real luego de crear tu household)
-- ============================================================
-- insert into categories (household_id, name, type, sort_order) values
--   (:household_id, 'Salario', 'ingreso', 1),
--   (:household_id, 'Gastos fijos', 'gasto', 1),
--   (:household_id, 'Comida', 'gasto', 2),
--   (:household_id, 'Ahorro', 'gasto', 3),
--   (:household_id, 'Ocio', 'gasto', 4);
