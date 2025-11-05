
import React from 'react';
import type { Chapter } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface EditorPanelProps {
  chapter: Chapter | null;
  content: string;
  onContentChange: (content: string) => void;
  onAnalyze: (type: 'analyze' | 'edit') => void;
  analysisResult: string;
  isAnalyzing: boolean;
}

const EditorPanel: React.FC<EditorPanelProps> = ({ chapter, content, onContentChange, onAnalyze, analysisResult, isAnalyzing }) => {
  if (!chapter) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
        <h2 className="text-xl font-semibold text-gray-400">Select a Chapter</h2>
        <p>Choose a chapter from the middle panel to start writing.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-700">
        <h3 className="text-2xl font-bold text-white">{chapter.chapterTitle}</h3>
        <p className="text-gray-400">{chapter.chapterDescription}</p>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 flex flex-col p-4">
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing your chapter here..."
            className="flex-1 w-full p-4 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300"
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col p-4 border-t md:border-t-0 md:border-l border-gray-700">
          <div className="flex items-center gap-4 mb-4">
            <h4 className="text-lg font-semibold text-gray-300">AI Writing Assistant</h4>
            <div className="flex gap-2">
              <button onClick={() => onAnalyze('analyze')} disabled={isAnalyzing || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Analyze</button>
              <button onClick={() => onAnalyze('edit')} disabled={isAnalyzing || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Suggest Edits</button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto prose prose-invert prose-sm max-w-none">
            {isAnalyzing ? (
               <div className="flex items-center justify-center h-full">
                 <div className="flex items-center gap-2 text-gray-400">
                  <SparklesIcon className="w-5 h-5 animate-pulse" />
                  <span>AI is thinking...</span>
                  </div>
               </div>
            ) : analysisResult ? (
              <div dangerouslySetInnerHTML={{ __html: analysisResult.replace(/\n/g, '<br />') }} />
            ) : (
              <p className="text-gray-500">Analysis and suggestions will appear here.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditorPanel;
