// trip-tools as an MCP server (stdio), registered in .mcp.json: the same tools as `node planner/tools.ts`,
// so a Claude Code session plans the trip on its own subscription with no Anthropic API calls.
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';

// stdout carries the protocol: everything the tools log goes to stderr instead.
console.log = (...a: unknown[]) => console.error(...a);
const { TOOLS, runTool } = await import('./tools.ts');

const server = new Server({ name: 'trip-tools', version: '1.0.0' }, { capabilities: { tools: {} } });
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({ name: t.name, description: t.description, inputSchema: z.toJSONSchema(t.input) as { type: 'object' } })),
}));
server.setRequestHandler(CallToolRequestSchema, async (req) => {
  try {
    const out = await runTool(req.params.name, req.params.arguments ?? {});
    return { content: [{ type: 'text', text: typeof out === 'string' ? out : JSON.stringify(out, null, 1) }] };
  } catch (e) {
    return { isError: true, content: [{ type: 'text', text: (e as Error).message }] };
  }
});
await server.connect(new StdioServerTransport());
