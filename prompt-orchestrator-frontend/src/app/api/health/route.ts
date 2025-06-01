/**
 * Health Check API Route
 * GET /api/health
 */

import { NextResponse } from 'next/server';
import { checkDatabaseHealth } from '@/lib/mongodb';

export async function GET() {
  try {
    // Check database connection
    const dbHealthy = await checkDatabaseHealth();

    const healthStatus = {
      status: 'healthy',
      message: 'DreamDev OS Frontend API is running',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {
        api: 'healthy',
        database: dbHealthy ? 'healthy' : 'unhealthy'
      },
      environment: {
        nodeEnv: process.env.NODE_ENV || 'development',
        mongoUri: process.env.MONGODB_URI ? 'configured' : 'not configured',
        mongoDbName: process.env.MONGODB_DB_NAME ? 'configured' : 'not configured'
      }
    };

    // If the database is unhealthy, return 503
    if (!dbHealthy) {
      return NextResponse.json(
        {
          ...healthStatus,
          status: 'unhealthy',
          message: 'API running but the database connection failed'
        },
        { status: 503 }
      );
    }

    return NextResponse.json(healthStatus);

  } catch (error: unknown) {
    console.error('❌ Health check failed:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: error instanceof Error ? error.message : 'Health check failed',
        timestamp: new Date().toISOString(),
        services: {
          api: 'healthy',
          database: 'unknown'
        }
      },
      { status: 500 }
    );
  }
}
