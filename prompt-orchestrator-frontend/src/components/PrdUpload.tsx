/**
 * Komponen untuk upload dan input PRD text
 */

'use client';

import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { PrdUploadProps } from '@/types';

const PrdUpload: React.FC<PrdUploadProps> = ({ 
  onPrdTextUploaded, 
  isProcessing, 
  error 
}) => {
  const [prdText, setPrdText] = useState('');
  const [uploadMethod, setUploadMethod] = useState<'text' | 'file'>('text');
  const [fileName, setFileName] = useState<string | null>(null);

  // Sample PRD text untuk demo
  const samplePrdText = `# Product Requirements Document (PRD) - DreamDev OS

## 1. Pendahuluan

DreamDev OS adalah sistem orkestrasi AI yang menghasilkan prompt super lengkap dan terstruktur. 
Sistem ini memungkinkan pengguna untuk menganalisis kebutuhan dan menghasilkan prompt yang actionable.
Admin dapat mengelola konfigurasi sistem dan developer akan menggunakan sistem untuk development.

### 1.1 Stakeholder

- Developer sebagai implementor utama
- Admin sebagai pengelola sistem
- User sebagai end user aplikasi

## 2. Fitur Utama

Sistem memiliki kemampuan untuk parsing dokumen PRD secara otomatis dengan akurasi tinggi.
Aplikasi memungkinkan pengguna untuk mengekstrak entitas dari konten dan menghasilkan task tree.

### 2.1 Core Features

- Parsing dokumen PRD dengan akurasi tinggi menggunakan NLP
- Ekstraksi entitas (aktor, sistem, fitur) secara otomatis
- Generasi prompt yang terstruktur dan actionable
- Manajemen context stack untuk tracking dependencies

#### 2.1.1 Document Processing Engine

Sistem menggunakan machine learning untuk mengidentifikasi:
- Actors: pengguna, admin, stakeholder, developer
- Systems: database, API, frontend, backend
- Features: fungsionalitas dan requirement spesifik

### 2.2 Advanced Features

User dapat mengunduh hasil analisis dalam format JSON.
Sistem bisa mengintegrasikan dengan Claude API untuk AI assistance.
Backend menggunakan Node.js dengan TypeScript dan Express.js.

## 3. Teknologi

Stack teknologi yang akan digunakan:

### 3.1 Backend

- Node.js dengan TypeScript
- Express.js atau Fastify untuk API
- MongoDB untuk database utama
- Pinecone untuk vector database

### 3.2 Frontend

- Next.js dengan TypeScript
- React untuk UI components
- Tailwind CSS untuk styling`;

  const handleTextChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrdText(event.target.value);
    setFileName(null);
  };

  const handleUploadText = () => {
    if (prdText.trim()) {
      onPrdTextUploaded(prdText.trim());
    }
  };

  const handleLoadSample = () => {
    setPrdText(samplePrdText);
    setFileName('sample-prd.md');
    setUploadMethod('text');
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setFileName(file.name);
      
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        setPrdText(text);
        onPrdTextUploaded(text);
      };
      reader.readAsText(file);
      setUploadMethod('file');
    }
  }, [onPrdTextUploaded]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
    },
    multiple: false
  });

  const isTextValid = prdText.trim().length > 0;
  const canProcess = isTextValid && !isProcessing;

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center">
          <FileText className="mr-2 h-6 w-6 text-blue-600" />
          Upload PRD Document
        </h2>
        <p className="text-gray-700 text-base">
          Upload your Product Requirements Document or paste the text directly to generate task tree and prompts.
        </p>
      </div>

      {/* Method Selection */}
      <div className="mb-6">
        <div className="flex space-x-4">
          <button
            onClick={() => setUploadMethod('text')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadMethod === 'text'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Text Input
          </button>
          <button
            onClick={() => setUploadMethod('file')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              uploadMethod === 'file'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            File Upload
          </button>
        </div>
      </div>

      {/* File Upload Area */}
      {uploadMethod === 'file' && (
        <div className="mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {isDragActive ? (
              <p className="text-blue-600 font-medium">Drop the PRD file here...</p>
            ) : (
              <div>
                <p className="text-gray-700 font-semibold mb-2 text-base">
                  Drag & drop PRD file here, or click to select
                </p>
                <p className="text-sm text-gray-600 font-medium">
                  Supports: .txt, .md, .doc, .docx files
                </p>
              </div>
            )}
          </div>
          {fileName && (
            <div className="mt-2 flex items-center text-sm text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              File loaded: {fileName}
            </div>
          )}
        </div>
      )}

      {/* Text Input Area */}
      {uploadMethod === 'text' && (
        <div className="mb-6">
          <div className="mb-2 flex justify-between items-center">
            <label htmlFor="prd-text" className="block text-sm font-semibold text-gray-800">
              PRD Text Content
            </label>
            <button
              onClick={handleLoadSample}
              className="text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              Load Sample PRD
            </button>
          </div>
          <textarea
            id="prd-text"
            value={prdText}
            onChange={handleTextChange}
            placeholder="Paste your PRD content here or click 'Load Sample PRD' to see an example..."
            className="w-full h-64 p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-vertical"
            disabled={isProcessing}
          />
          <div className="mt-2 flex justify-between items-center text-sm text-gray-700 font-medium">
            <span>Characters: {prdText.length}</span>
            <span>Lines: {prdText.split('\n').length}</span>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-700 font-medium">Error:</span>
          </div>
          <p className="text-red-600 mt-1">{error}</p>
        </div>
      )}

      {/* Process Button */}
      <div className="flex justify-center">
        <button
          onClick={handleUploadText}
          disabled={!canProcess}
          className={`px-8 py-3 rounded-lg font-medium transition-all flex items-center ${
            canProcess
              ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          {isProcessing ? (
            <>
              <Loader2 className="animate-spin h-5 w-5 mr-2" />
              Processing PRD...
            </>
          ) : (
            <>
              <FileText className="h-5 w-5 mr-2" />
              Process PRD
            </>
          )}
        </button>
      </div>

      {/* Help Text */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-semibold text-gray-900 mb-2 text-base">Tips for better results:</h3>
        <ul className="text-sm text-gray-700 space-y-1 font-medium">
          <li>• Use clear headings with # ## ### markdown syntax</li>
          <li>• Include stakeholder information and system requirements</li>
          <li>• Describe features and functionalities in detail</li>
          <li>• Mention technologies and implementation details</li>
        </ul>
      </div>
    </div>
  );
};

export default PrdUpload;
