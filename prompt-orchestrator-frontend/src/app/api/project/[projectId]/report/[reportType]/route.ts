/**
 * API Route for generating project reports
 * GET /api/project/[projectId]/report/[reportType]
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../../../lib/mongodb';
import { ReportGeneratorService } from '../../../../../../lib/reportGenerator.service';
import { ProjectDocument } from '../../../../../../types';

const reportGeneratorService = new ReportGeneratorService();

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string; reportType: string } }
) {
  try {
    const { projectId, reportType } = await params;

    // Validate parameters
    if (!projectId || !reportType) {
      return NextResponse.json(
        { message: 'Parameter projectId dan reportType dibutuhkan.' },
        { status: 400 }
      );
    }

    // Validate report type
    if (!reportGeneratorService.isValidReportType(reportType)) {
      const availableTypes = reportGeneratorService.getAvailableReportTypes() || [];
      return NextResponse.json(
        { 
          message: `Tipe laporan tidak didukung: ${reportType}. Didukung: ${availableTypes.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Connect to database and fetch project
    const { db } = await connectToDatabase();
    const project = await db.collection<ProjectDocument>('projects').findOne({ _id: projectId });

    if (!project) {
      return NextResponse.json(
        { message: `Proyek dengan ID ${projectId} tidak ditemukan.` },
        { status: 404 }
      );
    }

    // Generate report based on type
    let reportMarkdown = '';
    
    if (reportType === 'executive-summary') {
      reportMarkdown = reportGeneratorService.generateExecutiveSummary(project);
    } else if (reportType === 'technical-specification') {
      reportMarkdown = reportGeneratorService.generateTechnicalSpecification(project);
    }

    // Return markdown content
    return new NextResponse(reportMarkdown, {
      status: 200,
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        // Optional: Add filename for download
        // 'Content-Disposition': `attachment; filename="${projectId}-${reportType}.md"`
      }
    });

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Terjadi kesalahan internal saat membuat laporan.";
    const errorStack = error instanceof Error ? error.stack : undefined;
    console.error(`Error generating report (${(await params).reportType}) for project ${(await params).projectId}:`, error);
    
    return NextResponse.json(
      { 
        message: errorMessage,
        error: process.env.NODE_ENV === 'development' ? errorStack : undefined
      },
      { status: 500 }
    );
  }
}

// Only allow GET method
export async function POST() {
  return NextResponse.json(
    { message: 'Metode POST tidak diizinkan.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function PUT() {
  return NextResponse.json(
    { message: 'Metode PUT tidak diizinkan.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { message: 'Metode DELETE tidak diizinkan.' },
    { status: 405, headers: { Allow: 'GET' } }
  );
}