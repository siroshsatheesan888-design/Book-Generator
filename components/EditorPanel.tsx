import React from 'react';
import type { Chapter } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';

interface EditorPanelProps {
  chapter: Chapter | null;
  content: string;
  onContentChange: (content: string) => void;
  onAnalyze: (aspects: string[]) => void;
  onSuggestEdits: () => void;
  analysisResult: string;
  isAnalyzing: boolean;
  onGenerateContent: () => void;
  isGeneratingContent: boolean;
}

const ANALYSIS_ASPECTS = ['Tone', 'Pacing', 'Clarity', 'Plot Consistency'];

const EditorPanel: React.FC<EditorPanelProps> = ({
  chapter,
  content,
  onContentChange,
  onAnalyze,
  onSuggestEdits,
  analysisResult,
  isAnalyzing,
  onGenerateContent,
  isGeneratingContent,
}) => {
  const [selectedAspects, setSelectedAspects] = React.useState<string[]>(['Tone']);

  const handleAspectChange = (aspect: string) => {
    setSelectedAspects(prev =>
      prev.includes(aspect)
        ? prev.filter(a => a !== aspect)
        : [...prev, aspect]
    );
  };

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
        <div className="flex justify-between items-start gap-4">
            <div>
                <h3 className="text-2xl font-bold text-white">{chapter.chapterTitle}</h3>
                <p className="text-gray-400">{chapter.chapterDescription}</p>
            </div>
            <button 
                onClick={onGenerateContent} 
                disabled={isGeneratingContent}
                className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors flex-shrink-0"
            >
                {isGeneratingContent ? (
                    <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Generating...</span>
                    </>
                ) : (
                    <>
                    <SparklesIcon className="w-5 h-5" />
                    <span>Generate Content</span>
                    </>
                )}
            </button>
        </div>
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        <div className="w-full md:w-1/2 flex flex-col p-4 relative">
          {isGeneratingContent && (
            <div className="absolute inset-4 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3 text-gray-300">
                <SparklesIcon className="w-6 h-6 animate-pulse text-indigo-400" />
                <span className="text-lg">AI is writing your chapter...</span>
              </div>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing your chapter here, or use the AI to generate it."
            className="flex-1 w-full p-4 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300 disabled:opacity-70"
            disabled={isGeneratingContent}
          />
        </div>
        <div className="w-full md:w-1/2 flex flex-col p-4 border-t md:border-t-0 md:border-l border-gray-700">
          <div className="mb-4">
            <h4 className="text-lg font-semibold text-gray-300 mb-2">AI Writing Assistant</h4>
             <div className="mb-3">
                <p className="text-sm text-gray-400 mb-2">Select aspects to analyze:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {ANALYSIS_ASPECTS.map(aspect => (
                    <label key={aspect} className="flex items-center gap-2 cursor-pointer text-sm text-gray-300">
                        <input
                        type="checkbox"
                        checked={selectedAspects.includes(aspect)}
                        onChange={() => handleAspectChange(aspect)}
                        className="h-4 w-4 rounded bg-gray-800 border-gray-600 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        {aspect}
                    </label>
                    ))}
                </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => onAnalyze(selectedAspects)} disabled={isAnalyzing || !content || isGeneratingContent || selectedAspects.length === 0} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Analyze</button>
              <button onClick={onSuggestEdits} disabled={isAnalyzing || !content || isGeneratingContent} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Suggest Edits</button>
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
              <div dangerouslySetInnerHTML={{ __html: analysisResult.replace(/(?:\r\n|\r|\n)/g, '<br />') }} />
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