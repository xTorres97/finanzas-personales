import { createClient } from '@/lib/supabase/server'
import { getHouseholdId } from '@/lib/get-household'
import type { Category, Subcategory } from '@/lib/types'
import {
  addCategory,
  renameCategory,
  deleteCategory,
  addSubcategory,
  renameSubcategory,
  deleteSubcategory,
} from './actions'

export default async function CategoriesPage() {
  const householdId = await getHouseholdId()
  const supabase = await createClient()

  const [{ data: categories }, { data: subcategories }] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .eq('household_id', householdId ?? '')
      .order('type')
      .order('sort_order'),
    supabase
      .from('subcategories')
      .select('*')
      .order('sort_order'),
  ])

  const cats: Category[] = categories ?? []
  const subs: Subcategory[] = subcategories ?? []

  const ingresos = cats.filter((c) => c.type === 'ingreso')
  const gastos = cats.filter((c) => c.type === 'gasto')

  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Categorías</h1>
        <p className="text-sm text-[var(--muted)]">Organizá tus ingresos y gastos por categoría y subcategoría.</p>
      </header>

      <NewCategoryForm />

      <CategoryGroup title="Ingresos" categories={ingresos} subcategories={subs} accent="var(--income)" />
      <CategoryGroup title="Gastos" categories={gastos} subcategories={subs} accent="var(--expense)" />
    </main>
  )
}

function NewCategoryForm() {
  return (
    <form
      action={addCategory}
      className="mb-8 flex flex-col gap-3 rounded-xl border p-4"
      style={{ borderColor: 'var(--border)', background: 'var(--card)' }}
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <label className="flex-1">
          <span className="mb-1 block text-xs text-[var(--muted)]">Nueva categoría</span>
          <input
            name="name"
            type="text"
            required
            placeholder="Ej: Transporte"
            className="w-full rounded-lg border px-3 py-2 text-sm"
            style={{ borderColor: 'var(--border)' }}
          />
        </label>
        <label>
          <span className="mb-1 block text-xs text-[var(--muted)]">Tipo</span>
          <select
            name="type"
            className="w-full rounded-lg border px-3 py-2 text-sm sm:w-auto"
            style={{ borderColor: 'var(--border)' }}
          >
            <option value="gasto">Gasto</option>
            <option value="ingreso">Ingreso</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded-lg px-4 py-2 text-sm font-medium"
          style={{ background: 'var(--income)', color: 'var(--background)' }}
        >
          Agregar
        </button>
      </div>
      <label className="flex items-center gap-2 text-sm text-[var(--muted)]">
        <input type="checkbox" name="isSavings" />
        Es una categoría de ahorro (aparece separada en la pestaña Ahorros)
      </label>
    </form>
  )
}

function CategoryGroup({
  title,
  categories,
  subcategories,
  accent,
}: {
  title: string
  categories: Category[]
  subcategories: Subcategory[]
  accent: string
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-lg font-medium" style={{ color: accent }}>
        {title}
      </h2>
      {categories.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">Todavía no tenés categorías de {title.toLowerCase()}.</p>
      ) : (
        <div className="space-y-3">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              category={cat}
              subcategories={subcategories.filter((s) => s.category_id === cat.id)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function CategoryCard({ category, subcategories }: { category: Category; subcategories: Subcategory[] }) {
  return (
    <div className="rounded-xl border p-4" style={{ borderColor: 'var(--border)', background: 'var(--card)' }}>
      <div className="flex flex-wrap items-center gap-2">
        <form action={renameCategory} className="flex flex-1 items-center gap-2">
          <input type="hidden" name="id" value={category.id} />
          <input
            name="name"
            defaultValue={category.name}
            className="min-w-0 flex-1 rounded-lg border px-2 py-1.5 text-sm font-medium"
            style={{ borderColor: 'var(--border)' }}
          />
          <button type="submit" className="shrink-0 text-xs text-[var(--muted)] underline">
            Guardar
          </button>
        </form>
        <form action={deleteCategory}>
          <input type="hidden" name="id" value={category.id} />
          <button type="submit" className="shrink-0 text-xs" style={{ color: 'var(--expense)' }}>
            Eliminar
          </button>
        </form>
      </div>

      {/* Subcategorías */}
      <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: 'var(--border)' }}>
        {subcategories.map((sub) => (
          <div key={sub.id} className="flex items-center gap-2 pl-2">
            <form action={renameSubcategory} className="flex flex-1 items-center gap-2">
              <input type="hidden" name="id" value={sub.id} />
              <input
                name="name"
                defaultValue={sub.name}
                className="min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm"
                style={{ borderColor: 'var(--border)' }}
              />
              <button type="submit" className="shrink-0 text-xs text-[var(--muted)] underline">
                Guardar
              </button>
            </form>
            <form action={deleteSubcategory}>
              <input type="hidden" name="id" value={sub.id} />
              <button type="submit" className="shrink-0 text-xs" style={{ color: 'var(--expense)' }}>
                Eliminar
              </button>
            </form>
          </div>
        ))}

        <form action={addSubcategory} className="flex items-center gap-2 pl-2">
          <input type="hidden" name="categoryId" value={category.id} />
          <input
            name="name"
            placeholder="Nueva subcategoría"
            required
            className="min-w-0 flex-1 rounded-lg border px-2 py-1 text-sm"
            style={{ borderColor: 'var(--border)' }}
          />
          <button type="submit" className="shrink-0 text-xs underline" style={{ color: 'var(--income)' }}>
            + Agregar
          </button>
        </form>
      </div>
    </div>
  )
}