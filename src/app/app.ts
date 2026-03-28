import express from 'express';
import { healthRouter } from './routes/health.routes';
import { reportsRouter } from './routes/reports.routes';

export const app = express();
app.use(express.json({ limit: '10mb' }));

app.use('/api/health', healthRouter);
app.use('/api/reports', reportsRouter);
