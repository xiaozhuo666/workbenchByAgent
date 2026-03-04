const env = require("./env");

function getMcpConfig() {
  return { ...env.mcp };
}

module.exports = {
  getMcpConfig,
};
