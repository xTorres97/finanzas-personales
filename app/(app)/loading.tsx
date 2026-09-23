export default function Loading() {
  return (
    <main className="content-width px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-40 animate-pulse rounded-md" style={{ background: 'var(--card)' }} />
        <div className="h-4 w-56 animate-pulse rounded-md" style={{ background: 'var(--card)' }} />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }} />
        ))}
      </div>
      <div className="mt-6 h-40 animate-pulse rounded-xl border" style={{ background: 'var(--card)', borderColor: 'var(--border)' }} />
    </main>
  )
}