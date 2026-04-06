import express from 'express';
import { healthRouter } from './routes/health.routes';
import { reportsRouter } from './routes/reports.routes';
import { requestContextMiddleware } from './middleware/request-context.middleware';

export const app = express();
app.use(express.json({ limit: '10mb' }));
app.use(requestContextMiddleware);

app.use('/api/health', healthRouter);
app.use('/api/reports', reportsRouter);
