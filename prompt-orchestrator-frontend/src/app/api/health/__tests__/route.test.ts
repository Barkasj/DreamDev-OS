/**
 * Health API Route Tests
 * Testing health check endpoint functionality
 */

import { NextRequest } from 'next/server';
import { GET } from '../route';

// Mock MongoDB
jest.mock('../../../../lib/mongodb', () => ({
  checkDatabaseHealth: jest.fn()
}));

import { checkDatabaseHealth } from '../../../../lib/mongodb';

const mockCheckDatabaseHealth = checkDatabaseHealth as jest.MockedFunction<typeof checkDatabaseHealth>;

describe('/api/health', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('should return healthy status when database is connected', async () => {
      mockCheckDatabaseHealth.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data).toEqual({
        status: 'healthy',
        message: 'DreamDev OS Frontend API is running',
        timestamp: expect.any(String),
        version: '1.0.0',
        services: {
          api: 'healthy',
          database: 'healthy'
        },
        environment: {
          nodeEnv: 'test',
          mongoUri: 'configured',
          mongoDbName: 'configured'
        }
      });

      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);
    });

    it('should return unhealthy status when database is disconnected', async () => {
      mockCheckDatabaseHealth.mockResolvedValueOnce(false);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(503);
      
      const data = await response.json();
      expect(data).toEqual({
        status: 'unhealthy',
        message: 'API running but the database connection failed',
        timestamp: expect.any(String),
        version: '1.0.0',
        services: {
          api: 'healthy',
          database: 'unhealthy'
        },
        environment: {
          nodeEnv: 'test',
          mongoUri: 'configured',
          mongoDbName: 'configured'
        }
      });

      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);
    });

    it('should handle database health check errors', async () => {
      mockCheckDatabaseHealth.mockRejectedValueOnce(new Error('Database error'));

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      expect(response.status).toBe(500);
      
      const data = await response.json();
      expect(data).toEqual({
        status: 'error',
        message: 'Database error',
        timestamp: expect.any(String),
        services: {
          api: 'healthy',
          database: 'unknown'
        }
      });

      expect(mockCheckDatabaseHealth).toHaveBeenCalledTimes(1);
    });

    it('should return valid timestamp format', async () => {
      mockCheckDatabaseHealth.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      const data = await response.json();
      const timestamp = new Date(data.timestamp);
      
      expect(timestamp).toBeInstanceOf(Date);
      expect(timestamp.getTime()).not.toBeNaN();
    });

    it('should include correct service information', async () => {
      mockCheckDatabaseHealth.mockResolvedValueOnce(true);

      const request = new NextRequest('http://localhost:3000/api/health');
      const response = await GET(request);

      const data = await response.json();
      
      expect(data.message).toBe('DreamDev OS Frontend API is running');
      expect(data.version).toBe('1.0.0');
    });
  });
});