const dayjs = require("dayjs");
console.log("Local time:", dayjs().format("YYYY-MM-DD HH:mm:ss"));
console.log("Local day of week:", dayjs().day());
console.log("UTC time:", dayjs().utc ? dayjs().utc().format("YYYY-MM-DD HH:mm:ss") : "dayjs-utc not loaded");
