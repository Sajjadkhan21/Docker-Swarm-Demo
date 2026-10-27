const express = require('express');
const os = require('os');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Main endpoint: returns which container answered.
// os.hostname() inside a container = the container ID,
// which is how we prove load balancing later.
app.get('/', (req, res) => {
  res.json({
    message: 'Hello from Docker Swarm!',
    container: os.hostname(),
    pid: process.pid,
    time: new Date().toISOString()
  });
});

// Health endpoint: used by Docker HEALTHCHECK.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', container: os.hostname() });
});

// Simple POST endpoint to prove JSON parsing works.
app.post('/echo', (req, res) => {
  res.json({ received: req.body, container: os.hostname() });
});

// Deliberately kills this container's process.
// Used ONLY to demonstrate self-healing.
app.get('/crash', (req, res) => {
  res.json({ message: `Crashing container ${os.hostname()}...` });
  setTimeout(() => process.exit(1), 100);
});

// Graceful shutdown so `docker service update/scale` stops cleanly.
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down');
  process.exit(0);
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server listening on port ${PORT}, container ${os.hostname()}`);
});
