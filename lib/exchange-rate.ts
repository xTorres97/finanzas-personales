/**
 * Tasas de cambio para convertir movimientos en VES/EUR a su equivalente
 * en USD (la moneda "ancla" de la app).
 *
 * Fuentes:
 * - BCV (dólar y euro oficiales) vía DolarAPI, gratis y sin API key:
 *   https://dolarapi.com/docs/venezuela/
 * - Binance P2P (USDT/VES) — NO es una API oficial de Binance, es el
 *   endpoint interno que usa su propia web (el mismo que usan varias
 *   herramientas de la comunidad). Puede fallar o cambiar sin aviso.
 *
 * Cache: localStorage por 1h, para no pegarle a las APIs en cada carga.
 */

const DOLAR_BCV_URL = 'https://ve.dolarapi.com/v1/dolares/oficial'
const EURO_BCV_URL = 'https://ve.dolarapi.com/v1/euros/oficial'
const BINANCE_P2P_URL = 'https://p2p.binance.com/bapi/c2c/v2/friendly/c2c/adv/search'

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

export type RateSource = 'bcv' | 'binance'

/** Tasa oficial del dólar (BCV): cuántos VES por 1 USD. */
export async function fetchBcvRate(): Promise<ExchangeRate> {
  const cached = readCache('bcv_usd_rate_cache_v1')
  if (cached) return cached

  const res = await fetch(DOLAR_BCV_URL, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`DolarAPI (USD) respondió ${res.status}`)
  const data: DolarApiResponse = await res.json()

  const result: ExchangeRate = { rate: data.promedio, fetchedAt: data.fechaActualizacion }
  writeCache('bcv_usd_rate_cache_v1', result)
  return result
}

/** Tasa oficial del euro (BCV): cuántos VES por 1 EUR. */
export async function fetchBcvEurRate(): Promise<ExchangeRate> {
  const cached = readCache('bcv_eur_rate_cache_v1')
  if (cached) return cached

  const res = await fetch(EURO_BCV_URL, { next: { revalidate: 3600 } })
  if (!res.ok) throw new Error(`DolarAPI (EUR) respondió ${res.status}`)
  const data: DolarApiResponse = await res.json()

  const result: ExchangeRate = { rate: data.promedio, fetchedAt: data.fechaActualizacion }
  writeCache('bcv_eur_rate_cache_v1', result)
  return result
}

/**
 * Tasa "paralela" de referencia vía Binance P2P: mediana de los primeros
 * 10 anuncios de USDT/VES. No oficial — si Binance bloquea o cambia el
 * endpoint, esto puede empezar a fallar; por eso siempre se usa con
 * try/catch en el componente que la llama.
 */
export async function fetchBinanceP2PRate(): Promise<ExchangeRate> {
  const cached = readCache('binance_p2p_rate_cache_v1')
  if (cached) return cached

  const res = await fetch(BINANCE_P2P_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: JSON.stringify({
      asset: 'USDT',
      fiat: 'VES',
      tradeType: 'SELL',
      page: 1,
      rows: 10,
      payTypes: [],
      publisherType: null,
      merchantCheck: true,
    }),
  })

  if (!res.ok) throw new Error(`Binance P2P respondió ${res.status}`)
  const json = await res.json()

  const prices: number[] = (json?.data ?? [])
    .map((item: { adv?: { price?: string } }) => Number(item.adv?.price))
    .filter((p: number) => !Number.isNaN(p))

  if (prices.length === 0) throw new Error('Binance P2P no devolvió anuncios')

  prices.sort((a, b) => a - b)
  const mid = Math.floor(prices.length / 2)
  const median = prices.length % 2 === 0 ? (prices[mid - 1] + prices[mid]) / 2 : prices[mid]

  const result: ExchangeRate = { rate: median, fetchedAt: new Date().toISOString() }
  writeCache('binance_p2p_rate_cache_v1', result)
  return result
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

/** Convierte un monto en VES a USD, dada una tasa VES-por-USD (de cualquier fuente). */
export function vesToUsd(amount: number, vesPerUsd: number): number {
  return Number((amount / vesPerUsd).toFixed(2))
}

/** Convierte un monto en EUR a USD, cruzando las dos tasas BCV (VES/EUR ÷ VES/USD). */
export function eurToUsd(amount: number, vesPerEur: number, vesPerUsd: number): number {
  return Number(((amount * vesPerEur) / vesPerUsd).toFixed(2))
}