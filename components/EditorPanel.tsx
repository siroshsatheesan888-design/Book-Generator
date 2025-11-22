
import React, { useState, useEffect, useCallback, useRef } from 'react';
import type { Chapter } from '../types';
import { SparklesIcon } from './icons/SparklesIcon';
import Resizer from './Resizer';
import { UndoIcon } from './icons/UndoIcon';
import { RedoIcon } from './icons/RedoIcon';

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
  onHumanize: () => void;
  isHumanizing: boolean;
  onApplyGrammarFixes: () => void;
  isFixingGrammar: boolean;
  onCheckPlagiarism: () => void;
  isCheckingPlagiarism: boolean;
  onGenerateChapterImage: () => void;
  isGeneratingChapterImage: boolean;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
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
  onHumanize,
  isHumanizing,
  onApplyGrammarFixes,
  isFixingGrammar,
  onCheckPlagiarism,
  isCheckingPlagiarism,
  onGenerateChapterImage,
  isGeneratingChapterImage,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}) => {
  const [selectedAspects, setSelectedAspects] = useState<string[]>(['Tone']);
  
  // State for resizable editor panes
  const editorContainerRef = useRef<HTMLDivElement>(null);
  const [editorPaneWidths, setEditorPaneWidths] = useState([50, 50]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startWidths = editorPaneWidths;
    const container = editorContainerRef.current;
    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = container.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      const totalPercent = startWidths[0] + startWidths[1];
      
      let newLeftPercent = startWidths[0] + deltaPercent;
      let newRightPercent = startWidths[1] - deltaPercent;

      const minPercent = 20;
      if (newLeftPercent < minPercent) {
        newLeftPercent = minPercent;
        newRightPercent = totalPercent - newLeftPercent;
      } else if (newRightPercent < minPercent) {
        newRightPercent = minPercent;
        newLeftPercent = totalPercent - newRightPercent;
      }
      
      setEditorPaneWidths([newLeftPercent, newRightPercent]);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [editorPaneWidths]);


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

  const isAnyAIOperationRunning = isAnalyzing || isGeneratingContent || isHumanizing || isCheckingPlagiarism || isFixingGrammar || isGeneratingChapterImage;

  return (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-gray-700">
        <div className="flex justify-between items-start gap-4">
            <div>
                <h3 className="text-2xl font-bold text-white">{chapter.chapterTitle}</h3>
                <p className="text-gray-400">{chapter.chapterDescription}</p>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-1">
                    <button 
                        onClick={onUndo}
                        disabled={!canUndo || isAnyAIOperationRunning}
                        title="Undo (Ctrl+Z)"
                        className="p-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <UndoIcon className="w-5 h-5"/>
                    </button>
                     <button 
                        onClick={onRedo}
                        disabled={!canRedo || isAnyAIOperationRunning}
                        title="Redo (Ctrl+Y)"
                        className="p-2 text-gray-400 rounded-md hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RedoIcon className="w-5 h-5"/>
                    </button>
                </div>
                <div className="w-px h-8 bg-gray-600"></div>
                <button 
                    onClick={onGenerateContent} 
                    disabled={isGeneratingContent}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
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
      </div>
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden" ref={editorContainerRef}>
        <div 
          style={!isMobile ? { width: `${editorPaneWidths[0]}%` } : {}}
          className="w-full md:w-auto md:flex-shrink-0 flex flex-col p-4 relative"
        >
          {(isGeneratingContent || isHumanizing || isFixingGrammar || isGeneratingChapterImage) && (
            <div className="absolute inset-4 bg-gray-900/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-lg">
              <div className="flex items-center gap-3 text-gray-300">
                <SparklesIcon className="w-6 h-6 animate-pulse text-indigo-400" />
                <span className="text-lg">
                    {isHumanizing ? 'Humanizing your text...' : isFixingGrammar ? 'Applying grammar fixes...' : isGeneratingChapterImage ? 'Generating an image...' : 'AI is writing your chapter...'}
                </span>
              </div>
            </div>
          )}
          <textarea
            value={content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="Start writing your chapter here, or use the AI to generate it."
            className="flex-1 w-full p-4 bg-gray-900 border border-gray-700 rounded-lg resize-none focus:ring-indigo-500 focus:border-indigo-500 text-gray-300 disabled:opacity-70"
            disabled={isAnyAIOperationRunning}
          />
        </div>
        {!isMobile && <Resizer onMouseDown={handleMouseDown} />}
        <div 
          style={!isMobile ? { width: `${editorPaneWidths[1]}%` } : {}}
          className="w-full md:w-auto md:flex-1 flex flex-col p-4 border-t md:border-t-0 border-gray-700"
        >
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
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onAnalyze(selectedAspects)} disabled={isAnyAIOperationRunning || !content || selectedAspects.length === 0} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Analyze</button>
              <button onClick={onSuggestEdits} disabled={isAnyAIOperationRunning || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Suggest Edits</button>
              <button onClick={onApplyGrammarFixes} disabled={isAnyAIOperationRunning || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Fix Grammar & Spelling</button>
              <button onClick={onHumanize} disabled={isAnyAIOperationRunning || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Humanize Text</button>
              <button onClick={onGenerateChapterImage} disabled={isAnyAIOperationRunning || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Generate Chapter Image</button>
              <button onClick={onCheckPlagiarism} disabled={isAnyAIOperationRunning || !content} className="px-3 py-1 text-sm bg-gray-700 rounded-md hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed">Check Plagiarism</button>
            </div>
          </div>
          <div className="flex-1 p-4 bg-gray-900 border border-gray-700 rounded-lg overflow-y-auto prose prose-invert prose-sm max-w-none">
            {isAnalyzing || isCheckingPlagiarism ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex items-center gap-2 text-gray-400">
                  <SparklesIcon className="w-5 h-5 animate-pulse" />
                  <span>{isCheckingPlagiarism ? 'Checking for plagiarism...' : 'AI is thinking...'}</span>
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
