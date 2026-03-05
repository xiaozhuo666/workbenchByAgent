const { spawn } = require('child_process');
const path = require('path');

/**
 * MCP 服务器管理器
 * 负责启动、通信和自动发现工具定义
 */
class McpServerManager {
  constructor() {
    this.servers = new Map(); // 存储已加载的 server 实例
    this.tools = new Map();   // 存储所有发现的工具定义
  }

  /**
   * 注册并初始化一个 MCP Server
   */
  async registerServer(serverName, config) {
    console.log(`[MCP Manager] Registering server: ${serverName}`);
    
    const serverInstance = {
      name: serverName,
      config: config,
      tools: []
    };

    try {
      // 1. 获取工具列表 (Discovery)
      const tools = await this._fetchTools(config);
      serverInstance.tools = tools;
      
      // 2. 存入全局工具池
      tools.forEach(tool => {
        this.tools.set(tool.name, {
          ...tool,
          serverName: serverName,
          config: config
        });
      });

      this.servers.set(serverName, serverInstance);
      console.log(`[MCP Manager] Server ${serverName} registered with ${tools.length} tools.`);
      return tools;
    } catch (error) {
      console.error(`[MCP Manager] Failed to register server ${serverName}:`, error);
      return [];
    }
  }

  /**
   * 通过 stdio 调用 tools/list 获取定义
   */
  async _fetchTools(config) {
    return new Promise((resolve, reject) => {
      const child = spawn(config.command, config.args, { 
        env: { ...process.env, ...config.env },
        shell: true 
      });

      let stdout = '';
      const request = {
        jsonrpc: "2.0",
        id: "discovery",
        method: "tools/list",
        params: {}
      };

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();

      child.stdout.on('data', (data) => stdout += data.toString());
      child.on('close', (code) => {
        try {
          const jsonMatch = stdout.match(/\{.*\}/s);
          if (!jsonMatch) throw new Error("No JSON response");
          const response = JSON.parse(jsonMatch[0]);
          resolve(response.result?.tools || []);
        } catch (e) {
          reject(e);
        }
      });
    });
  }

  /**
   * 执行工具调用
   */
  async callTool(toolName, args) {
    const toolDef = this.tools.get(toolName);
    if (!toolDef) throw new Error(`Tool ${toolName} not found`);

    return new Promise((resolve) => {
      const child = spawn(toolDef.config.command, toolDef.config.args, { 
        env: { ...process.env, ...toolDef.config.env },
        shell: true 
      });

      let stdout = '';
      const request = {
        jsonrpc: "2.0",
        id: Date.now(),
        method: "tools/call",
        params: { name: toolName, arguments: args }
      };

      child.stdin.write(JSON.stringify(request) + '\n');
      child.stdin.end();

      child.stdout.on('data', (data) => stdout += data.toString());
      child.on('close', (code) => {
        try {
          const jsonMatch = stdout.match(/\{.*\}/s);
          const response = JSON.parse(jsonMatch[0]);
          resolve(response.result);
        } catch (e) {
          resolve({ content: [{ type: 'text', text: `Error: ${e.message}` }] });
        }
      });
    });
  }

  /**
   * 获取所有工具的 OpenAI 格式定义
   */
  getOpenAiTools() {
    return Array.from(this.tools.values()).map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));
  }

  /**
   * 获取所有工具（含 serverName），用于分组展示
   */
  getToolsWithServer() {
    return Array.from(this.tools.values()).map(tool => ({
      name: tool.name,
      description: tool.description,
      inputSchema: tool.inputSchema,
      serverName: tool.serverName,
    }));
  }

  /**
   * 获取某服务器下的所有工具名
   */
  getToolNamesByServer(serverName) {
    return Array.from(this.tools.values())
      .filter(t => t.serverName === serverName)
      .map(t => t.name);
  }
}

// 单例模式
module.exports = new McpServerManager();
