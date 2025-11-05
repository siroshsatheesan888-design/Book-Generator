import React from 'react';
import type { BookIdea, Chapter } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';
import { RefreshIcon } from './icons/RefreshIcon';

interface MainContentProps {
  idea: BookIdea | null;
  chapters: Chapter[];
  selectedChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onGenerateOutline: () => void;
  isLoadingOutline: boolean;
  onGenerateNewTitle: () => void;
  isGeneratingTitle: boolean;
  onGenerateCoverIdeas: () => void;
  isGeneratingCoverIdeas: boolean;
  onGenerateCoverImage: () => void;
  isGeneratingCoverImage: boolean;
  onGenerateAmazonDetails: () => void;
  isGeneratingAmazonDetails: boolean;
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
  onGenerateNewTitle,
  isGeneratingTitle,
  onGenerateCoverIdeas,
  isGeneratingCoverIdeas,
  onGenerateCoverImage,
  isGeneratingCoverImage,
  onGenerateAmazonDetails,
  isGeneratingAmazonDetails
}) => {
  if (!idea) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center text-gray-500">
        <BookOpenIcon className="w-16 h-16 mb-4" />
        <h2 className="text-xl font-semibold text-gray-400">Select an Idea</h2>
        <p>Choose a book idea from the left panel to see its details and generate chapters.</p>
      </div>
    );
  }

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
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">AI Generators</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            <GeneratorButton onClick={onGenerateOutline} disabled={isLoadingOutline} loadingText="Outlining...">Generate Outline</GeneratorButton>
            <GeneratorButton onClick={onGenerateCoverIdeas} disabled={isGeneratingCoverIdeas} loadingText="Dreaming...">Cover Ideas</GeneratorButton>
            <GeneratorButton onClick={onGenerateCoverImage} disabled={isGeneratingCoverImage} loadingText="Painting...">Cover Image</GeneratorButton>
            <GeneratorButton onClick={onGenerateAmazonDetails} disabled={isGeneratingAmazonDetails} loadingText="Publishing...">KDP Details</GeneratorButton>
        </div>
      </div>
      
      <h3 className="text-xl font-semibold text-gray-300 mb-3">Chapters</h3>
      <div className="flex-1 overflow-y-auto space-y-2 pr-2 -mr-2">
        {chapters.length > 0 ? (
          chapters.map((chapter, index) => (
            <div
              key={chapter.id}
              onClick={() => onSelectChapter(chapter)}
              className={`p-3 rounded-lg cursor-pointer border border-transparent transition-all ${
                selectedChapterId === chapter.id
                  ? 'bg-indigo-900/50 border-indigo-700'
                  : 'bg-gray-800 hover:bg-gray-700'
              }`}
            >
              <h4 className="font-semibold text-white">Chapter {index + 1}: {chapter.chapterTitle}</h4>
              <p className="text-sm text-gray-400 mt-1">{chapter.chapterDescription}</p>
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