import express, { type Request, type Response } from 'express'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'

import { createMcpServer } from './create-server.js'

export async function startHttpServer(): Promise<void> {
  const app = express()

  app.use(express.json({ limit: '1mb' }))

  app.get('/health', (_request: Request, response: Response) => {
    response.status(200).json({
      status: 'healthy',
      service: 'census-api-mcp',
    })
  })

  const mcpServer = createMcpServer()

  // Stateless mode is the simplest option for an HTTP-based MCP endpoint.
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  })

  app.post('/mcp', async (request: Request, response: Response) => {
    await transport.handleRequest(request, response, request.body)
  })

  app.get('/mcp', async (request: Request, response: Response) => {
    await transport.handleRequest(request, response)
  })

  app.delete('/mcp', async (request: Request, response: Response) => {
    await transport.handleRequest(request, response)
  })

  await mcpServer.connect(transport)

  const port = Number.parseInt(process.env.PORT ?? '8080', 10)

  await new Promise<void>((resolve, reject) => {
    const server = app.listen(port, '0.0.0.0', () => {
      console.info(`Census MCP server listening on port ${port}`)
      console.info(`MCP endpoint: http://localhost:${port}/mcp`)
      console.info(`Health endpoint: http://localhost:${port}/health`)
      resolve()
    })

    server.on('error', reject)
  })
}
