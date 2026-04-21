import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

const useNeonAdapter = process.env.USE_NEON_ADAPTER === "true"

const createPrismaClient = (): PrismaClient => {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    // Only throws when a query actually runs — not at module load.
    // Keeps `next build` / "collecting page data" working in envs
    // (e.g. Vercel preview) where DATABASE_URL isn't provided.
    throw new Error("DATABASE_URL is not set")
  }
  if (useNeonAdapter) {
    const pool = new Pool({ connectionString })
    const adapter = new PrismaNeon(pool)
    return new PrismaClient({ adapter })
  }
  return new PrismaClient()
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

/**
 * Lazy Prisma handle. The underlying client is created on first property
 * access, so importing this module is safe even when DATABASE_URL is unset
 * (e.g. during Vercel preview "Collecting page data" phase).
 */
export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    if (!globalForPrisma.prisma) {
      globalForPrisma.prisma = createPrismaClient()
    }
    const value = Reflect.get(globalForPrisma.prisma as object, prop, receiver)
    return typeof value === "function"
      ? value.bind(globalForPrisma.prisma)
      : value
  },
})
