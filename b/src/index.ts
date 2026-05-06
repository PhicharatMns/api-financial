import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import YahooFinance from 'yahoo-finance2'
import cron from 'node-cron'

const app = new Hono()
const yahooFinance = new YahooFinance()

const FX_SYMBOL = 'USDTHB=X'
const BUDGET_THB = 25060.09

let logs = []

async function runAIP(symbol: string) {
  try {
    const [stock, fx] = await Promise.all([
      yahooFinance.quote(symbol),
      yahooFinance.quote(FX_SYMBOL)
    ])

    const priceUSD = stock.regularMarketPrice
    const usdThb = fx.regularMarketPrice

    if (!priceUSD || !usdThb) {
      throw new Error('Invalid market data')
    }

    const priceTHB = priceUSD * usdThb
    const shares = BUDGET_THB / priceTHB

    const data = {
      symbol,
      priceUSD,
      usdThb,
      priceTHB: Number(priceTHB.toFixed(2)),
      shares: Number(shares.toFixed(4)),
      budget: BUDGET_THB,
      time: new Date().toISOString()
    }

    logs.push(data)

    console.log(' AIP EXECUTED:', data)

    return data
  } catch (err: any) {
    console.error(' ERROR AIP:', err)
    return { error: err.message }
  }
}

app.get('/aip/run/:symbol', async (c) => {
  const symbol = c.req.param('symbol').toUpperCase()

  const result = await runAIP(symbol)

  return c.json(result)
})

serve({
  fetch: app.fetch,
  port: 3000
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
})