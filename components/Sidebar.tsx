
import React from 'react';
import type { BookIdea } from '../types';
import { PlusIcon } from './icons/PlusIcon';
import { SparklesIcon } from './icons/SparklesIcon';

interface SidebarProps {
  ideas: BookIdea[];
  selectedIdeaId?: string;
  onSelectIdea: (idea: BookIdea) => void;
  onGenerateIdeas: () => void;
  isLoading: boolean;
  genre: string;
  onGenreChange: (genre: string) => void;
}

const GENRES = ["Fantasy", "Sci-Fi", "Mystery", "Thriller", "Romance", "Historical Fiction"];

const Sidebar: React.FC<SidebarProps> = ({ ideas, selectedIdeaId, onSelectIdea, onGenerateIdeas, isLoading, genre, onGenreChange }) => {
  return (
    <div className="flex flex-col h-full bg-gray-800/50 p-4">
      <div className="mb-4">
        <label htmlFor="genre-select" className="block text-sm font-medium text-gray-400 mb-2">Select a Genre</label>
        <select
          id="genre-select"
          value={genre}
          onChange={(e) => onGenreChange(e.target.value)}
          className="w-full bg-gray-700 border border-gray-600 text-white rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
        >
          {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>

      <button
        onClick={onGenerateIdeas}
        disabled={isLoading}
        className="w-full flex items-center justify-center gap-2 px-4 py-2 mb-4 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? (
          <>
            <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Generating...
          </>
        ) : (
          <>
            <SparklesIcon className="w-5 h-5" />
            Generate Ideas
          </>
        )}
      </button>

      <h2 className="text-lg font-semibold text-gray-300 mb-2">Your Ideas</h2>
      <div className="flex-1 overflow-y-auto space-y-2">
        {ideas.length === 0 && !isLoading && (
          <div className="text-center text-gray-500 py-8">
            <p>Generate some book ideas to get started!</p>
          </div>
        )}
        {ideas.map((idea) => (
          <div
            key={idea.id}
            onClick={() => onSelectIdea(idea)}
            className={`p-3 rounded-lg cursor-pointer transition-colors ${
              selectedIdeaId === idea.id ? 'bg-indigo-500/30 ring-1 ring-indigo-500' : 'hover:bg-gray-700'
            }`}
          >
            <h3 className="font-semibold text-white truncate">{idea.title}</h3>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
