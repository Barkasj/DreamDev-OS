/**
 * Simplified tests for Report API Route
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';

// Mock the dependencies
jest.mock('../../../../../../../lib/mongodb', () => ({
  connectToDatabase: jest.fn()
}));

jest.mock('../../../../../../../lib/reportGenerator.service', () => ({
  ReportGeneratorService: jest.fn().mockImplementation(() => ({
    isValidReportType: jest.fn(),
    getAvailableReportTypes: jest.fn(),
    generateExecutiveSummary: jest.fn(),
    generateTechnicalSpecification: jest.fn(),
    getReportTypeDisplayName: jest.fn()
  }))
}));

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

  describe('GET method parameter validation', () => {
    it('should return 400 for missing projectId', async () => {
      const request = new NextRequest('http://localhost:3000/api/project//report/executive-summary');
      const params = { projectId: '', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toContain('Parameter projectId dan reportType dibutuhkan');
    });

    it('should return 400 for missing reportType', async () => {
      const request = new NextRequest('http://localhost:3000/api/project/test-project-123/report/');
      const params = { projectId: 'test-project-123', reportType: '' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toContain('Parameter projectId dan reportType dibutuhkan');
    });
  });
});