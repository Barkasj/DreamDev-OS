/**
 * Komponen untuk menampilkan prompt yang dihasilkan dalam format Markdown
 */

'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { 
  Copy, 
  Download, 
  Eye, 
  Code, 
  Loader2, 
  FileText,
  CheckCircle,
  Calendar,
  BarChart3,
  Users,
  Settings,
  Star
} from 'lucide-react';
import { PromptDisplayProps } from '@/types';

const PromptDisplay: React.FC<PromptDisplayProps> = ({
  prompt,
  metadata,
  isLoading
}) => {
  const [viewMode, setViewMode] = useState<'rendered' | 'raw'>('rendered');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([prompt], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `prompt-${metadata?.taskName?.replace(/\s+/g, '-').toLowerCase() || 'generated'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mr-3" />
          <span className="text-gray-600">Generating prompt...</span>
        </div>
      </div>
    );
  }

  if (!prompt) {
    return (
      <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No Prompt Generated</h3>
          <p className="text-gray-600">
            Please select a task from the task tree to generate its prompt.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-800 flex items-center">
            <FileText className="mr-2 h-6 w-6 text-blue-600" />
            Generated Prompt
          </h2>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode(viewMode === 'rendered' ? 'raw' : 'rendered')}
              className="flex items-center px-3 py-2 text-sm bg-gray-200 hover:bg-gray-300 rounded-lg transition-colors"
            >
              {viewMode === 'rendered' ? (
                <>
                  <Code className="h-4 w-4 mr-1" />
                  Raw
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4 mr-1" />
                  Rendered
                </>
              )}
            </button>
            
            <button
              onClick={handleCopy}
              className="flex items-center px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              {copySuccess ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </button>
            
            <button
              onClick={handleDownload}
              className="flex items-center px-3 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </button>
          </div>
        </div>

        {/* Task Info */}
        {metadata && (
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2 text-lg">{metadata.taskName}</h3>
                <div className="flex items-center space-x-4 text-sm text-gray-700">
                  <span className="flex items-center">
                    <BarChart3 className="h-4 w-4 mr-1" />
                    Level {metadata.level}
                  </span>
                  <span className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {new Date(metadata.generatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Users className="h-4 w-4 text-blue-500" />
                  </div>
                  <div className="font-semibold text-gray-900 text-lg">{metadata.detectedEntities.actors.length}</div>
                  <div className="text-gray-700 font-medium">Actors</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Settings className="h-4 w-4 text-green-500" />
                  </div>
                  <div className="font-semibold text-gray-900 text-lg">{metadata.detectedEntities.systems.length}</div>
                  <div className="text-gray-700 font-medium">Systems</div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center mb-1">
                    <Star className="h-4 w-4 text-purple-500" />
                  </div>
                  <div className="font-semibold text-gray-900 text-lg">{metadata.detectedEntities.features.length}</div>
                  <div className="text-gray-700 font-medium">Features</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Prompt Content */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        {viewMode === 'rendered' ? (
          <div className="prose-dreamdev max-w-none p-6 bg-white">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="text-2xl font-bold text-gray-900 mb-4 border-b-2 border-blue-500 pb-2">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="text-xl font-semibold text-gray-900 mb-3 mt-6">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="text-lg font-semibold text-gray-800 mb-2 mt-4">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="text-gray-800 mb-3 leading-relaxed text-base">
                    {children}
                  </p>
                ),
                li: ({ children }) => (
                  <li className="text-gray-800 mb-1 leading-relaxed">
                    {children}
                  </li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-gray-900">
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className="bg-gray-100 px-2 py-1 rounded text-sm font-mono text-gray-900 border">
                    {children}
                  </code>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-blue-500 pl-4 py-2 bg-blue-50 text-gray-800 italic">
                    {children}
                  </blockquote>
                ),
              }}
            >
              {prompt}
            </ReactMarkdown>
          </div>
        ) : (
          <div className="bg-gray-900 text-gray-100 p-6 overflow-x-auto">
            <pre className="text-sm font-mono whitespace-pre-wrap">
              {prompt}
            </pre>
          </div>
        )}
      </div>

      {/* Metadata */}
      {metadata && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-3 text-lg">Prompt Statistics:</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-700 font-medium">Characters:</span>
              <span className="ml-2 font-semibold text-gray-900">{metadata.characterCount.toLocaleString()}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Lines:</span>
              <span className="ml-2 font-semibold text-gray-900">{metadata.lineCount}</span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Words:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {prompt.split(/\s+/).filter(word => word.length > 0).length.toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-700 font-medium">Reading time:</span>
              <span className="ml-2 font-semibold text-gray-900">
                {Math.ceil(prompt.split(/\s+/).length / 200)} min
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromptDisplay;
