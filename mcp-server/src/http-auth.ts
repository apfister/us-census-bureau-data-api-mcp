import { createHash, timingSafeEqual } from 'node:crypto'
import type { RequestHandler } from 'express'

const AUTHENTICATION_CHALLENGE = 'Bearer realm="census-api-mcp"'

function digest(value: string): Buffer {
  return createHash('sha256').update(value, 'utf8').digest()
}

export function createMcpBearerAuth(
  serverKey = process.env.MCP_AUTH_KEY,
): RequestHandler {
  return (request, response, next) => {
    const authorization = request.get('authorization')
    const match = /^Bearer ([^\s]+)$/.exec(authorization ?? '')
    const authorized =
      Boolean(serverKey) &&
      match !== null &&
      timingSafeEqual(digest(match[1]), digest(serverKey as string))

    if (!authorized) {
      response.setHeader('WWW-Authenticate', AUTHENTICATION_CHALLENGE)
      response.status(401).json({ error: 'Unauthorized' })
      return
    }

    next()
  }
}
