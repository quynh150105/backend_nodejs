import express from 'express';
import cors from 'cors';
import { authRoutes, adminRoutes } from './routes/index.js';
import { sendError, sendSuccess } from './utils/response.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Advanced request and error logger
app.use((req, res, next) => {
  const start = Date.now();
  const originalJson = res.json;

  res.json = function (body) {
    const duration = Date.now() - start;
    const isError = res.statusCode >= 400;
    let logMsg = `[${new Date().toLocaleString()}] ${req.method} ${req.url} | Status: ${res.statusCode} | ${duration}ms`;

    if (isError) {
      logMsg += ` | Error: ${body.message || 'Unknown error'}`;

      if (req.body && Object.keys(req.body).length > 0) {
        const safeBody = { ...req.body };
        if (safeBody.password) safeBody.password = '***';
        logMsg += ` | Body: ${JSON.stringify(safeBody)}`;
      }
    } else {
      logMsg += ' | Success';
    }

    console.log(logMsg);
    return originalJson.call(this, body);
  };

  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/', (req, res) => {
  return sendSuccess(res, { message: 'Auth API is running' });
});

// 404 handler
app.use((req, res) => {
  return sendError(res, { statusCode: 404, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  return sendError(res, { message: 'Internal server error' });
});

export default app;
