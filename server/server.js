const app = require('./app');
const config = require('./config/env');
const { connectDB, closeDB } = require('./config/db');

async function start() {
  try {
    await connectDB();
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    process.exit(1);
  }

  const server = app.listen(config.port, () => {
    console.log(`Portfolio & Blog API ready on http://localhost:${config.port}`);
    console.log(`Health check: http://localhost:${config.port}/health`);
  });

  async function shutdown(signal) {
    console.log(`\n${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await closeDB();
      process.exit(0);
    });
    // Do not hang forever if a connection refuses to close.
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

start();
