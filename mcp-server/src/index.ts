import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'

import { createMcpServer } from './create-server.js'
import { startHttpServer } from './http.js'

const transportMode = (process.env.MCP_TRANSPORT ?? 'stdio').toLowerCase()
const enableDebugLogs = process.env.DEBUG_LOGS === 'true'

// Standard output carries MCP messages in stdio mode, so ordinary logs must
// remain disabled unless debugging is explicitly enabled.
if (transportMode === 'stdio' && !enableDebugLogs) {
  console.log = () => {}
  console.info = () => {}
  console.warn = () => {}
}

async function main(): Promise<void> {
  if (transportMode === 'http') {
    await startHttpServer()
    return
  }

  if (transportMode !== 'stdio') {
    throw new Error(
      `Unsupported MCP_TRANSPORT value: ${transportMode}. Use "stdio" or "http".`,
    )
  }

  const mcpServer = createMcpServer()
  const transport = new StdioServerTransport()

  await mcpServer.connect(transport)
}

main().catch((error: unknown) => {
  console.error(error)
  process.exitCode = 1
})
