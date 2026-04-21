import { Pool, neonConfig } from "@neondatabase/serverless"
import { PrismaNeon } from "@prisma/adapter-neon"
import { PrismaClient } from "@prisma/client"
import ws from "ws"

if (typeof WebSocket === "undefined") {
  neonConfig.webSocketConstructor = ws
}

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

const useNeonAdapter = process.env.USE_NEON_ADAPTER === "true"

const createPrismaClient = () => {
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

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
