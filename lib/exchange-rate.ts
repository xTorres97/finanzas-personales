/**
 * Tasas de referencia para convertir un monto en VES a su equivalente en
 * USD (la moneda "ancla" de la app). Las tres funcionan igual: devuelven
 * un número de "bolívares por unidad", y para convertir simplemente se
 * divide el monto en VES por ese número — sin importar si la tasa viene
 * del dólar oficial, del paralelo, o del euro (así se usa en Venezuela:
 * el euro BCV funciona como una tercera referencia de conversión, no
 * como una moneda en sí).
 *
 * Fuentes, todas vía DolarAPI (gratis, sin API key, mismo dominio):
 * https://dolarapi.com/docs/venezuela/
 * - BCV: dólar oficial
 * - Paralelo: dólar no oficial (fuente: Yadio) — la referencia de
 *   "mercado paralelo/calle" que la gente suele llamar indistintamente
 *   "tasa Binance" o "tasa paralela"
 * - Euro BCV: euro oficial, usado acá como tercera tasa de conversión
 *
 * Cache: localStorage por 1h, para no pegarle a la API en cada carga.
 */

const DOLAR_BCV_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const DOLAR_PARALELO_URL = 'https://ve.dolarapi.com/v1/dolares/paralelo'
const EURO_BCV_URL = 'https://ve.dolarapi.com/v1/euros/oficial'

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

export type RateSource = 'bcv' | 'paralelo' | 'euro'

async function fetchDolarApi(url: string, cacheKey: string): Promise<ExchangeRate> {
  const cached = readCache(cacheKey)
  if (cached) return cached

  const res = await fetch(url, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`DolarAPI respondió ${res.status}`)
  const data: DolarApiResponse = await res.json()

  const result: ExchangeRate = { rate: data.promedio, fetchedAt: data.fechaActualizacion }
  writeCache(cacheKey, result)
  return result
}

/** Tasa oficial del dólar (BCV): cuántos VES por 1 USD. */
export function fetchBcvRate(): Promise<ExchangeRate> {
  return fetchDolarApi(DOLAR_BCV_URL, 'bcv_usd_rate_cache_v1')
}

/** Tasa paralela del dólar (fuente: Yadio, vía DolarAPI): cuántos VES por 1 USD. */
export function fetchParaleloRate(): Promise<ExchangeRate> {
  return fetchDolarApi(DOLAR_PARALELO_URL, 'paralelo_rate_cache_v1')
}

/** Tasa oficial del euro (BCV), usada como tercera referencia de conversión. */
export function fetchEuroBcvRate(): Promise<ExchangeRate> {
  return fetchDolarApi(EURO_BCV_URL, 'bcv_eur_rate_cache_v1')
}

export function fetchRateBySource(source: RateSource): Promise<ExchangeRate> {
  if (source === 'bcv') return fetchBcvRate()
  if (source === 'paralelo') return fetchParaleloRate()
  return fetchEuroBcvRate()
}

function readCache(key: string): ExchangeRate | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const { value, savedAt } = JSON.parse(raw)
    if (Date.now() - savedAt > CACHE_TTL_MS) return null
    return value as ExchangeRate
  } catch {
    return null
  }
}

function writeCache(key: string, value: ExchangeRate) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(key, JSON.stringify({ value, savedAt: Date.now() }))
  } catch {
    // localStorage puede fallar en modo privado; no es crítico
  }
}

/** Convierte un monto en VES a USD, dada cualquiera de las tres tasas de arriba. */
export function toUsd(amount: number, rate: number): number {
  return Number((amount / rate).toFixed(2))
}