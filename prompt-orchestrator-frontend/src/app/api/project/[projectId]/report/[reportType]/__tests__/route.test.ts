/**
 * Unit tests for Report API Route
 */

import { NextRequest } from 'next/server';
import { GET, POST, PUT, DELETE } from '../route';
import { connectToDatabase } from '../../../../../../../lib/mongodb';
import { ReportGeneratorService } from '../../../../../../../lib/reportGenerator.service';

// Mock dependencies
jest.mock('../../../../../../../lib/mongodb');
jest.mock('../../../../../../../lib/reportGenerator.service');

const mockConnectToDatabase = connectToDatabase as jest.MockedFunction<typeof connectToDatabase>;
const MockReportGeneratorService = ReportGeneratorService as jest.MockedClass<typeof ReportGeneratorService>;

describe('/api/project/[projectId]/report/[reportType] API Route', () => {
  let mockDb: any;
  let mockCollection: any;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock database
    mockCollection = {
      findOne: jest.fn()
    };
    mockDb = {
      collection: jest.fn().mockReturnValue(mockCollection)
    };
    mockConnectToDatabase.mockResolvedValue({ db: mockDb });

    // Mock report service methods
    MockReportGeneratorService.prototype.isValidReportType = jest.fn();
    MockReportGeneratorService.prototype.getAvailableReportTypes = jest.fn().mockReturnValue(['executive-summary', 'technical-specification']);
    MockReportGeneratorService.prototype.generateExecutiveSummary = jest.fn();
    MockReportGeneratorService.prototype.generateTechnicalSpecification = jest.fn();
    MockReportGeneratorService.prototype.getReportTypeDisplayName = jest.fn();
  });

  const createMockRequest = (url: string) => {
    return new NextRequest(url);
  };

  const mockProject = {
    _id: 'test-project-123',
    originalPrdText: 'Test PRD',
    taskTree: [],
    globalContext: 'Test context',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  describe('GET method', () => {
    it('should generate executive summary successfully', async () => {
      const mockMarkdown = '# Executive Summary\nTest content';
      
      MockReportGeneratorService.prototype.isValidReportType = jest.fn().mockReturnValue(true);
      MockReportGeneratorService.prototype.generateExecutiveSummary = jest.fn().mockReturnValue(mockMarkdown);
      mockCollection.findOne.mockResolvedValue(mockProject);

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/executive-summary');
      const params = { projectId: 'test-project-123', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseText = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
      expect(responseText).toBe(mockMarkdown);
    });

    it('should generate technical specification successfully', async () => {
      const mockMarkdown = '# Technical Specification\nTest content';
      
      mockReportService.isValidReportType.mockReturnValue(true);
      mockReportService.generateTechnicalSpecification.mockReturnValue(mockMarkdown);
      mockCollection.findOne.mockResolvedValue(mockProject);

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/technical-specification');
      const params = { projectId: 'test-project-123', reportType: 'technical-specification' };

      const response = await GET(request, { params });
      const responseText = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get('Content-Type')).toBe('text/markdown; charset=utf-8');
      expect(responseText).toBe(mockMarkdown);
      expect(mockReportService.generateTechnicalSpecification).toHaveBeenCalledWith(mockProject);
    });

    it('should return 400 for missing projectId', async () => {
      const request = createMockRequest('http://localhost:3000/api/project//report/executive-summary');
      const params = { projectId: '', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toContain('Parameter projectId dan reportType dibutuhkan');
    });

    it('should return 400 for missing reportType', async () => {
      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/');
      const params = { projectId: 'test-project-123', reportType: '' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toContain('Parameter projectId dan reportType dibutuhkan');
    });

    it('should return 400 for invalid report type', async () => {
      mockReportService.isValidReportType.mockReturnValue(false);
      mockReportService.getAvailableReportTypes.mockReturnValue(['executive-summary', 'technical-specification']);

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/invalid-type');
      const params = { projectId: 'test-project-123', reportType: 'invalid-type' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.message).toContain('Tipe laporan tidak didukung: invalid-type');
      expect(responseData.message).toContain('executive-summary, technical-specification');
    });

    it('should return 404 for non-existent project', async () => {
      mockReportService.isValidReportType.mockReturnValue(true);
      mockCollection.findOne.mockResolvedValue(null);

      const request = createMockRequest('http://localhost:3000/api/project/non-existent/report/executive-summary');
      const params = { projectId: 'non-existent', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.message).toContain('Proyek dengan ID non-existent tidak ditemukan');
    });

    it('should return 500 for database connection error', async () => {
      mockReportService.isValidReportType.mockReturnValue(true);
      mockConnectToDatabase.mockRejectedValue(new Error('Database connection failed'));

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/executive-summary');
      const params = { projectId: 'test-project-123', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toContain('Database connection failed');
    });

    it('should return 500 for report generation error', async () => {
      mockReportService.isValidReportType.mockReturnValue(true);
      mockReportService.generateExecutiveSummary.mockImplementation(() => {
        throw new Error('Report generation failed');
      });
      mockCollection.findOne.mockResolvedValue(mockProject);

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/executive-summary');
      const params = { projectId: 'test-project-123', reportType: 'executive-summary' };

      const response = await GET(request, { params });
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.message).toContain('Report generation failed');
    });

    it('should call correct database collection', async () => {
      mockReportService.isValidReportType.mockReturnValue(true);
      mockReportService.generateExecutiveSummary.mockReturnValue('# Test');
      mockCollection.findOne.mockResolvedValue(mockProject);

      const request = createMockRequest('http://localhost:3000/api/project/test-project-123/report/executive-summary');
      const params = { projectId: 'test-project-123', reportType: 'executive-summary' };

      await GET(request, { params });

      expect(mockDb.collection).toHaveBeenCalledWith('projects');
      expect(mockCollection.findOne).toHaveBeenCalledWith({ _id: 'test-project-123' });
    });
  });

  describe('Other HTTP methods', () => {
    it('should return 405 for POST method', async () => {
      const { POST } = await import('../route');
      const response = await POST();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
      expect(responseData.message).toContain('Metode POST tidak diizinkan');
    });

    it('should return 405 for PUT method', async () => {
      const { PUT } = await import('../route');
      const response = await PUT();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
      expect(responseData.message).toContain('Metode PUT tidak diizinkan');
    });

    it('should return 405 for DELETE method', async () => {
      const { DELETE } = await import('../route');
      const response = await DELETE();
      const responseData = await response.json();

      expect(response.status).toBe(405);
      expect(response.headers.get('Allow')).toBe('GET');
      expect(responseData.message).toContain('Metode DELETE tidak diizinkan');
    });
  });
});