import type { NextFunction, Request, Response } from 'express'
import { describe, expect, it, vi } from 'vitest'

import { createMcpBearerAuth } from '../src/http-auth.js'

function requestWithAuthorization(value?: string): Request {
  return {
    get: vi.fn().mockReturnValue(value),
  } as unknown as Request
}

function responseRecorder(): {
  response: Response
  setHeader: ReturnType<typeof vi.fn>
  status: ReturnType<typeof vi.fn>
  json: ReturnType<typeof vi.fn>
} {
  const setHeader = vi.fn()
  const json = vi.fn()
  const status = vi.fn().mockReturnValue({ json })
  return {
    response: { setHeader, status } as unknown as Response,
    setHeader,
    status,
    json,
  }
}

describe('MCP bearer authentication', () => {
  it.each([
    ['missing server key', undefined, 'Bearer expected-token'],
    ['missing authorization', 'expected-token', undefined],
    ['wrong scheme', 'expected-token', 'Basic expected-token'],
    ['missing token', 'expected-token', 'Bearer'],
    ['wrong token', 'expected-token', 'Bearer other-token'],
    ['extra token text', 'expected-token', 'Bearer expected-token extra'],
  ])('rejects %s', (_description, serverKey, authorization) => {
    const next: NextFunction = vi.fn()
    const { response, setHeader, status, json } = responseRecorder()

    createMcpBearerAuth(serverKey)(
      requestWithAuthorization(authorization),
      response,
      next,
    )

    expect(next).not.toHaveBeenCalled()
    expect(setHeader).toHaveBeenCalledWith(
      'WWW-Authenticate',
      'Bearer realm="census-api-mcp"',
    )
    expect(status).toHaveBeenCalledWith(401)
    expect(json).toHaveBeenCalledWith({ error: 'Unauthorized' })
  })

  it('accepts only the exact configured bearer token', () => {
    const next: NextFunction = vi.fn()
    const { response, setHeader, status } = responseRecorder()

    createMcpBearerAuth('expected-token')(
      requestWithAuthorization('Bearer expected-token'),
      response,
      next,
    )

    expect(next).toHaveBeenCalledOnce()
    expect(setHeader).not.toHaveBeenCalled()
    expect(status).not.toHaveBeenCalled()
  })
})
