
import React from 'react';
import type { BookIdea, Chapter } from '../types';
import { BookOpenIcon } from './icons/BookOpenIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface MainContentProps {
  idea: BookIdea | null;
  chapters: Chapter[];
  selectedChapterId?: string;
  onSelectChapter: (chapter: Chapter) => void;
  onGenerateChapters: () => void;
  isLoading: boolean;
}

const MainContent: React.FC<MainContentProps> = ({ idea, chapters, selectedChapterId, onSelectChapter, onGenerateChapters, isLoading }) => {
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
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">{idea.title}</h2>
        <p className="text-gray-400">{idea.synopsis}</p>
      </div>

      <div className="mb-4">
        <button
          onClick={onGenerateChapters}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Generating Chapters...
            </>
          ) : (
            <>
              <SparklesIcon className="w-5 h-5" />
              Generate Chapters
            </>
          )}
        </button>
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
        ) : !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <p>Click "Generate Chapters" to create an outline for your book.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;
