
import React, { useState, useCallback } from 'react';
import type { BookIdea, Chapter } from './types';
import * as geminiService from './services/geminiService';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import EditorPanel from './components/EditorPanel';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [bookIdeas, setBookIdeas] = useState<BookIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BookIdea | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  // Using a map to store content for each chapter
  const [chapterContents, setChapterContents] = useState<Map<string, string>>(new Map());
  const [analysisResult, setAnalysisResult] = useState<string>('');

  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingChapters, setIsLoadingChapters] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('Fantasy');

  const handleGenerateIdeas = useCallback(async () => {
    setIsLoadingIdeas(true);
    setError(null);
    setSelectedIdea(null);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    try {
      const ideas = await geminiService.generateBookIdeas(genre);
      setBookIdeas(ideas);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingIdeas(false);
    }
  }, [genre]);

  const handleSelectIdea = (idea: BookIdea) => {
    setSelectedIdea(idea);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
  };

  const handleGenerateChapters = useCallback(async () => {
    if (!selectedIdea) return;
    setIsLoadingChapters(true);
    setError(null);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    try {
      const generatedChapters = await geminiService.generateChapters(selectedIdea.title, selectedIdea.synopsis);
      setChapters(generatedChapters);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingChapters(false);
    }
  }, [selectedIdea]);

  const handleSelectChapter = (chapter: Chapter) => {
    setSelectedChapter(chapter);
    setAnalysisResult('');
  };

  const handleContentChange = (content: string) => {
    if (selectedChapter) {
      setChapterContents(prev => new Map(prev).set(selectedChapter.id, content));
    }
  };

  const currentChapterContent = selectedChapter ? chapterContents.get(selectedChapter.id) || '' : '';

  const handleAnalyze = async (type: 'analyze' | 'edit') => {
    if (!selectedChapter) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setError(null);
    try {
      let result;
      if (type === 'analyze') {
        result = await geminiService.analyzeContent(currentChapterContent);
      } else {
        result = await geminiService.suggestEdits(currentChapterContent);
      }
      setAnalysisResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };


  return (
    <div className="flex flex-col h-screen font-sans bg-gray-900 text-gray-200">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Mojo Book Writer AI</h1>
        </div>
      </header>

      {error && (
        <div className="px-4 py-2 text-center text-white bg-red-600">
          <p>{error}</p>
          <button onClick={() => setError(null)} className="ml-4 font-bold">Dismiss</button>
        </div>
      )}

      <main className="flex flex-1 overflow-hidden">
        <div className="grid w-full h-full grid-cols-1 md:grid-cols-12">
          <div className="col-span-12 md:col-span-3 lg:col-span-2 xl:col-span-3 border-r border-gray-700 overflow-y-auto">
            <Sidebar
              ideas={bookIdeas}
              selectedIdeaId={selectedIdea?.id}
              onSelectIdea={handleSelectIdea}
              onGenerateIdeas={handleGenerateIdeas}
              isLoading={isLoadingIdeas}
              genre={genre}
              onGenreChange={setGenre}
            />
          </div>
          <div className="col-span-12 md:col-span-4 lg:col-span-5 xl:col-span-4 border-r border-gray-700 overflow-y-auto">
            <MainContent
              idea={selectedIdea}
              chapters={chapters}
              selectedChapterId={selectedChapter?.id}
              onSelectChapter={handleSelectChapter}
              onGenerateChapters={handleGenerateChapters}
              isLoading={isLoadingChapters}
            />
          </div>
          <div className="col-span-12 md:col-span-5 lg:col-span-5 xl:col-span-5 flex flex-col overflow-y-auto">
            <EditorPanel
              chapter={selectedChapter}
              content={currentChapterContent}
              onContentChange={handleContentChange}
              onAnalyze={handleAnalyze}
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
