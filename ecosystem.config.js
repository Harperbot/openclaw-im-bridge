module.exports = {
  apps: [{
    name: "openclaw-bridge",
    script: "./index.js",
    watch: false,
    max_memory_restart: "200M",
    env: {
      NODE_ENV: "production",
    }
  }]
}