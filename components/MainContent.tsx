import React, { useState } from 'react';
import type { BookIdea, Chapter } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { RefreshIcon } from './icons/RefreshIcon';
import { PencilIcon } from './icons/PencilIcon';
import { TrashIcon } from './icons/TrashIcon';
import { DragHandleIcon } from './icons/DragHandleIcon';
import { SitemapIcon } from './icons/SitemapIcon';

interface MainContentProps {
  idea: BookIdea | null;
  chapters: Chapter[];
  selectedChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onGenerateOutline: () => void;
  isLoadingOutline: boolean;
  numChaptersToGenerate: number;
  onNumChaptersChange: (num: number) => void;
  onGenerateNewTitle: () => void;
  isGeneratingTitle: boolean;
  onGenerateCoverIdeas: () => void;
  isGeneratingCoverIdeas: boolean;
  onGenerateCoverImage: () => void;
  isGeneratingCoverImage: boolean;
  onGenerateAmazonDetails: () => void;
  isGeneratingAmazonDetails: boolean;
  onGenerateTrilogy: () => void;
  isGeneratingTrilogy: boolean;
  isEditingChapters: boolean;
  onToggleChapterEditing: () => void;
  onRenameChapter: (id: string, newTitle: string) => void;
  onReorderChapters: (chapters: Chapter[]) => void;
  onDeleteChapter: (id: string) => void;
  onExportToPdf: () => void;
  onOpenConnectionManager: (chapter: Chapter) => void;
}

const GeneratorButton: React.FC<{onClick: () => void, disabled: boolean, loadingText: string, children: React.ReactNode}> = ({ onClick, disabled, loadingText, children }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-500/50 disabled:cursor-not-allowed transition-colors text-sm"
  >
    {disabled ? (
      <>
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        {loadingText}
      </>
    ) : (
      <>
        <SparklesIcon className="w-4 h-4" />
        {children}
      </>
    )}
  </button>
);


const MainContent: React.FC<MainContentProps> = ({
  idea,
  chapters,
  selectedChapterId,
  onSelectChapter,
  onGenerateOutline,
  isLoadingOutline,
  numChaptersToGenerate,
  onNumChaptersChange,
  onGenerateNewTitle,
  isGeneratingTitle,
  onGenerateCoverIdeas,
  isGeneratingCoverIdeas,
  onGenerateCoverImage,
  isGeneratingCoverImage,
  onGenerateAmazonDetails,
  isGeneratingAmazonDetails,
  onGenerateTrilogy,
  isGeneratingTrilogy,
  isEditingChapters,
  onToggleChapterEditing,
  onRenameChapter,
  onReorderChapters,
  onDeleteChapter,
  onExportToPdf,
  onOpenConnectionManager,
}) => {
  const [renamingChapterId, setRenamingChapterId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const dragItem = React.useRef<Chapter | null>(null);
  const dragOverItem = React.useRef<Chapter | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);

  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <BookOpenIcon className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold text-gray-400">Select an Idea</h2>
        <p>Choose a book idea from the left panel to see its details and generate chapters.</p>
      </div>
    );
  }

  const handleRenameClick = (chapter: Chapter) => {
    setRenamingChapterId(chapter.id);
    setRenameValue(chapter.chapterTitle);
  };

  const handleRenameSubmit = (chapterId: string) => {
    if (renameValue.trim()) {
      onRenameChapter(chapterId, renameValue.trim());
    }
    setRenamingChapterId(null);
    setRenameValue('');
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, chapter: Chapter) => {
    dragItem.current = chapter;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, chapter: Chapter) => {
    e.preventDefault();
    if (dragItem.current?.id !== chapter.id) {
        dragOverItem.current = chapter;
        setDragOverId(chapter.id);
    }
  };

  const handleDragEnd = () => {
    if (dragItem.current && dragOverItem.current && dragItem.current.id !== dragOverItem.current.id) {
        const currentIndex = chapters.findIndex(ch => ch.id === dragItem.current!.id);
        const targetIndex = chapters.findIndex(ch => ch.id === dragOverItem.current!.id);
        
        const newChapters = [...chapters];
        const [removed] = newChapters.splice(currentIndex, 1);
        newChapters.splice(targetIndex, 0, removed);
        
        onReorderChapters(newChapters);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDragOverId(null);
  };

  return (
    <div className="p-6 h-full flex flex-col">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
            <h2 className="text-3xl font-bold text-white">{idea.title}</h2>
            <button
                onClick={onGenerateNewTitle}
                disabled={isGeneratingTitle}
                className="p-1 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                title="Generate a new title"
            >
                {isGeneratingTitle ? (
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                ) : (
                    <RefreshIcon className="w-5 h-5" />
                )}
            </button>
        </div>
        <p className="text-gray-400">{idea.synopsis}</p>
      </div>

      <div className="my-4 p-4 rounded-lg bg-gray-800/50">
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Generators & Tools</h3>
        
        <div className="flex items-center gap-2 mb-3 bg-gray-900/40 p-3 rounded-lg border border-gray-700/50">
            <label htmlFor="num-chapters" className="text-sm font-medium text-gray-300">
                Number of Chapters:
            </label>
            <input
                type="number"
                id="num-chapters"
                value={numChaptersToGenerate}
                onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    onNumChaptersChange(isNaN(val) ? 1 : Math.max(1, Math.min(50, val)));
                }}
                min="1"
                max="50"
                className="w-20 bg-gray-700 border border-gray-600 text-white rounded-lg p-2 text-center focus:ring-indigo-500 focus:border-indigo-500 text-sm"
            />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
            <GeneratorButton onClick={onGenerateOutline} disabled={isLoadingOutline} loadingText="Outlining...">Generate Outline</GeneratorButton>
            <GeneratorButton onClick={onGenerateTrilogy} disabled={isGeneratingTrilogy} loadingText="Sequencing...">Trilogy Sequence</GeneratorButton>
            <GeneratorButton onClick={onGenerateCoverIdeas} disabled={isGeneratingCoverIdeas} loadingText="Dreaming...">Cover Ideas</GeneratorButton>
            <GeneratorButton onClick={onGenerateCoverImage} disabled={isGeneratingCoverImage} loadingText="Painting...">Cover Image</GeneratorButton>
            <GeneratorButton onClick={onGenerateAmazonDetails} disabled={isGeneratingAmazonDetails} loadingText="Publishing...">KDP Details</GeneratorButton>
            <button onClick={onExportToPdf} disabled={!chapters.length} className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:bg-green-500/50 disabled:cursor-not-allowed transition-colors text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                Export as Book (PDF)
            </button>
        </div>
      </div>
      
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl font-semibold text-gray-300">Chapters</h3>
        {chapters.length > 0 && (
          <button 
            onClick={onToggleChapterEditing} 
            className={`px-3 py-1 text-sm font-semibold rounded-md transition-colors ${isEditingChapters ? 'bg-indigo-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}>
            {isEditingChapters ? 'Done Editing' : 'Edit Chapters'}
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              draggable={isEditingChapters}
              onDragStart={isEditingChapters ? (e) => handleDragStart(e, chapter) : undefined}
              onDragEnter={isEditingChapters ? (e) => handleDragEnter(e, chapter) : undefined}
              onDragOver={isEditingChapters ? (e) => e.preventDefault() : undefined}
              onDragEnd={isEditingChapters ? handleDragEnd : undefined}
              onClick={() => onSelectChapter(chapter)}
              className={`p-3 rounded-lg border border-transparent transition-all flex items-start justify-between gap-2 ${dragOverId === chapter.id ? 'drag-over' : ''} ${
                isEditingChapters
                  ? 'bg-gray-800 cursor-grab'
                  : selectedChapterId === chapter.id
                  ? 'bg-indigo-900/50 border-indigo-700'
                  : 'bg-gray-800 hover:bg-gray-700 cursor-pointer'
              }`}
            >
              {isEditingChapters ? (
                <>
                  <DragHandleIcon className="w-5 h-5 text-gray-500 flex-shrink-0 mt-1" />
                  <div className="flex-grow">
                  {renamingChapterId === chapter.id ? (
                      <input 
                        type="text"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onBlur={() => handleRenameSubmit(chapter.id)}
                        onKeyDown={(e) => e.key === 'Enter' && handleRenameSubmit(chapter.id)}
                        autoFocus
                        className="w-full bg-gray-600 text-white rounded px-2 py-1 text-sm"
                      />
                  ) : (
                    <span className="font-semibold text-white">Chapter {index + 1}: {chapter.chapterTitle}</span>
                  )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button onClick={(e) => {e.stopPropagation(); handleRenameClick(chapter)}} className="p-1 text-gray-400 hover:text-white"><PencilIcon className="w-4 h-4" /></button>
                    <button onClick={(e) => {e.stopPropagation(); onDeleteChapter(chapter.id)}} className="p-1 text-gray-400 hover:text-red-400"><TrashIcon className="w-4 h-4" /></button>
                  </div>
                </>
              ) : (
                <>
                <div className="flex-grow">
                  <h4 className="font-semibold text-white">Chapter {index + 1}: {chapter.chapterTitle}</h4>
                  <p className="text-sm text-gray-400 mt-1">{chapter.chapterDescription}</p>
                   {chapter.connections && chapter.connections.length > 0 && (
                    <div className="mt-2 text-xs text-gray-500">
                      <span className="font-semibold text-gray-400">→ Connects to: </span>
                      {chapter.connections.map((conn, i) => {
                        const targetChapter = chapters.find(c => c.id === conn.targetId);
                        return (
                          <span key={i}>
                            <button onClick={(e) => { e.preventDefault(); e.stopPropagation(); targetChapter && onSelectChapter(targetChapter); }} className="text-indigo-400 hover:underline">
                              {targetChapter?.chapterTitle || 'Unknown Chapter'}
                            </button>
                            {i < chapter.connections.length - 1 && ', '}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
                <button onClick={(e) => { e.stopPropagation(); onOpenConnectionManager(chapter); }} className="p-1 text-gray-400 hover:text-white flex-shrink-0" title="Manage Connections">
                  <SitemapIcon className="w-5 h-5" />
                </button>
                </>
              )}
            </div>
          ))
        ) : !isLoadingOutline && (
          <div className="text-center text-gray-500 py-8">
            <p>Click "Generate Outline" to create a plan for your book.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;