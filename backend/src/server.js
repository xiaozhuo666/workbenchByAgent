const app = require("./app");
const env = require("./config/env");

app.listen(env.port, () => {
  console.log(`backend listening on ${env.port}`);
});

// Keep process alive
setInterval(() => {}, 1000);
