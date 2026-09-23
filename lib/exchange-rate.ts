/**
 * Trae la tasa oficial del dólar (BCV) desde DolarAPI.
 * Gratis, sin API key: https://dolarapi.com/docs/venezuela/
 *
 * Estrategia de cache:
 * - En el cliente: localStorage con expiración de 1h (evita pegarle a la API
 *   en cada carga de pantalla).
 * - Opcional: también podés guardar snapshots en la tabla
 *   `exchange_rate_snapshots` de Supabase para llevar histórico propio
 *   (ver supabase/schema.sql).
 */

const DOLAR_API_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const CACHE_KEY = 'bcv_rate_cache_v1'
const CACHE_TTL_MS = 60 * 60 * 1000 // 1 hora

interface DolarApiResponse {
  fuente: string
  nombre: string
  compra: number | null
  venta: number | null
  promedio: number
  fechaActualizacion: string
}

export interface ExchangeRate {
  rate: number
  fetchedAt: string
}

export async function fetchBcvRate(): Promise<ExchangeRate> {
  // 1. Intentar cache local (solo en cliente)
  if (typeof window !== 'undefined') {
    const cached = readCache()
    if (cached) return cached
  }

  // 2. Pedir a la API
  const res = await fetch(DOLAR_API_URL, { next: { revalidate: 3600 } })
  if (!res.ok) {
    throw new Error(`DolarAPI respondió ${res.status}`)
  }
  const data: DolarApiResponse = await res.json()

  const result: ExchangeRate = {
    rate: data.promedio,
    fetchedAt: data.fechaActualizacion,
  }

  if (typeof window !== 'undefined') writeCache(result)

  return result
}

function readCache(): ExchangeRate | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const { value, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > CACHE_TTL_MS) return null
    return value as ExchangeRate
  } catch {
    return null
  }
}

function writeCache(value: ExchangeRate) {
  try {
    localStorage.setItem(
      CACHE_KEY,
      JSON.stringify({ value, savedAt: Date.now() })
    )
  } catch {
    // localStorage puede fallar en modo privado; no es crítico
  }
}

/** Convierte un monto a USD dado su moneda original y la tasa BCV vigente. */
export function toUsd(amount: number, currency: 'USD' | 'VES', bcvRate: number): number {
  if (currency === 'USD') return amount
  return Number((amount / bcvRate).toFixed(2))
}
