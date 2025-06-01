/**
 * Report Display Component
 * Displays generated project reports with markdown rendering
 */

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { FileText, Download, Loader2, AlertCircle } from 'lucide-react';

interface ReportDisplayProps {
  projectId: string | null;
  isLoading?: boolean;
}

interface ReportState {
  reportContent: string | null;
  isLoadingReport: boolean;
  currentReportType: string | null;
  error: string | null;
}

const REPORT_TYPES = [
  { id: 'executive-summary', name: 'Executive Summary', description: 'Ringkasan eksekutif proyek (2-3 halaman)' },
  { id: 'technical-specification', name: 'Technical Specification', description: 'Spesifikasi teknis detail (10-20 halaman)' }
];

export default function ReportDisplay({ projectId, isLoading = false }: ReportDisplayProps) {
  const [reportState, setReportState] = useState<ReportState>({
    reportContent: null,
    isLoadingReport: false,
    currentReportType: null,
    error: null
  });

  const handleGenerateReport = async (reportType: string) => {
    if (!projectId) {
      setReportState(prev => ({
        ...prev,
        error: "Harap proses PRD terlebih dahulu untuk mendapatkan ID Proyek."
      }));
      return;
    }

    setReportState(prev => ({
      ...prev,
      isLoadingReport: true,
      reportContent: null,
      currentReportType: reportType,
      error: null
    }));

    try {
      const response = await fetch(`/api/project/${projectId}/report/${reportType}`);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Unknown error' }));
        throw new Error(errorData.message || `Gagal membuat laporan: ${response.status}`);
      }

      const markdown = await response.text();
      
      setReportState(prev => ({
        ...prev,
        reportContent: markdown,
        isLoadingReport: false
      }));

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan saat membuat laporan";
      console.error(`Error generating report ${reportType}:`, error);
      setReportState(prev => ({
        ...prev,
        error: `Error membuat laporan: ${errorMessage}`,
        currentReportType: null,
        isLoadingReport: false
      }));
    }
  };

  const handleDownloadReport = () => {
    if (!reportState.reportContent || !reportState.currentReportType) return;

    // Remove unused variable
    // const reportType = REPORT_TYPES.find(type => type.id === reportState.currentReportType);
    const filename = `${projectId}-${reportState.currentReportType}.md`;
    
    const blob = new Blob([reportState.reportContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleErrorDismiss = () => {
    setReportState(prev => ({ ...prev, error: null }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-blue-600" />
        <span className="ml-3 text-gray-600">Loading...</span>
      </div>
    );
  }

  if (!projectId) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">No Project Selected</h3>
        <p className="mt-1 text-sm text-gray-500">
          Please upload and process a PRD first to generate reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Report Generation Controls */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Generate Project Reports</h2>
        
        {/* Error Display */}
        {reportState.error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{reportState.error}</p>
                </div>
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleErrorDismiss}
                    className="bg-red-50 text-red-800 rounded-md text-sm font-medium px-3 py-2 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Report Type Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {REPORT_TYPES.map((reportType) => (
            <div key={reportType.id} className="border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900">{reportType.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{reportType.description}</p>
              <button
                onClick={() => handleGenerateReport(reportType.id)}
                disabled={reportState.isLoadingReport}
                className={`mt-3 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white ${
                  reportState.isLoadingReport && reportState.currentReportType === reportType.id
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {reportState.isLoadingReport && reportState.currentReportType === reportType.id ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="h-4 w-4 mr-2" />
                    Generate {reportType.name}
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Loading Indicator */}
        {reportState.isLoadingReport && (
          <div className="mt-4 text-center">
            <p className="text-sm text-gray-600">
              Sedang memproses permintaan laporan untuk: {
                REPORT_TYPES.find(type => type.id === reportState.currentReportType)?.name
              }...
            </p>
          </div>
        )}
      </div>

      {/* Report Content Display */}
      {reportState.reportContent && reportState.currentReportType && (
        <div className="bg-white shadow rounded-lg">
          {/* Report Header */}
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-medium text-gray-900">
                {REPORT_TYPES.find(type => type.id === reportState.currentReportType)?.name}
              </h3>
              <p className="text-sm text-gray-500">Project ID: {projectId}</p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Download Markdown
            </button>
          </div>

          {/* Report Content */}
          <div className="px-6 py-4">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{reportState.reportContent}</ReactMarkdown>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}