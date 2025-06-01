/**
 * Simplified Unit tests for Report API Route
 * Focus on core functionality without complex mocking
 */

import { NextRequest } from 'next/server';
import { POST, PUT, DELETE } from '../route';

describe('/api/project/[projectId]/report/[reportType] API Route', () => {
  describe('HTTP Methods', () => {
    it('should return 405 for POST method', async () => {
      const response = await POST();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(responseData.message).toContain('Metode POST tidak diizinkan');
    });

    it('should return 405 for PUT method', async () => {
      const response = await PUT();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(responseData.message).toContain('Metode PUT tidak diizinkan');
    });

    it('should return 405 for DELETE method', async () => {
      const response = await DELETE();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(responseData.message).toContain('Metode DELETE tidak diizinkan');
    });
  });
});