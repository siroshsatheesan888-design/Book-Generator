import React, { useState, useCallback, useMemo } from 'react';
import type { BookIdea, Chapter, AmazonKDPDetails, TrilogyBook } from './types';
import * as geminiService from './services/geminiService';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import EditorPanel from './components/EditorPanel';
import Modal from './components/Modal';
import { SparklesIcon } from './components/icons/SparklesIcon';

const App: React.FC = () => {
  const [bookIdeas, setBookIdeas] = useState<BookIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BookIdea | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  const [chapterContents, setChapterContents] = useState<Map<string, string>>(new Map());
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('Fantasy');
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);

  // Loading states
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingCoverIdeas, setIsGeneratingCoverIdeas] = useState(false);
  const [isGeneratingCoverImage, setIsGeneratingCoverImage] = useState(false);
  const [isGeneratingAmazonDetails, setIsGeneratingAmazonDetails] = useState(false);
  const [isGeneratingTrilogy, setIsGeneratingTrilogy] = useState(false);
  
  // Modal State
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { totalWordCount, totalPages } = useMemo(() => {
    let count = 0;
    for (const content of chapterContents.values()) {
        // filter(Boolean) handles empty strings from multiple spaces
        count += content.trim().split(/\s+/).filter(Boolean).length;
    }
    return {
        totalWordCount: count,
        totalPages: Math.ceil(count / 250),
    };
  }, [chapterContents]);

  const handleGenerateIdeas = useCallback(async () => {
    setIsLoadingIdeas(true);
    setError(null);
    setSelectedIdea(null);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    try {
      const ideas = await geminiService.generateBookIdeas(genre, favoriteTopics);
      setBookIdeas(ideas);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingIdeas(false);
    }
  }, [genre, favoriteTopics]);

  const handleSelectIdea = (idea: BookIdea) => {
    setSelectedIdea(idea);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
  };

  const handleGenerateOutline = useCallback(async () => {
    if (!selectedIdea) return;
    setIsLoadingOutline(true);
    setError(null);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    try {
      const generatedChapters = await geminiService.generateOutline(selectedIdea.title, selectedIdea.synopsis);
      setChapters(generatedChapters);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingOutline(false);
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
  
  const handleGenerateContent = useCallback(async () => {
    if (!selectedIdea || !selectedChapter) return;
    setIsGeneratingContent(true);
    setError(null);
    try {
      const content = await geminiService.generateChapterContent(
        selectedIdea.title,
        selectedIdea.synopsis,
        selectedChapter.chapterTitle,
        selectedChapter.chapterDescription
      );
      handleContentChange(content);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsGeneratingContent(false);
    }
  }, [selectedIdea, selectedChapter]);

  const currentChapterContent = selectedChapter ? chapterContents.get(selectedChapter.id) || '' : '';

  const handleAnalysisRequest = async (aspects: string[]) => {
    if (!selectedChapter || !selectedIdea) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setError(null);
    try {
      const result = await geminiService.analyzeContent(
        currentChapterContent,
        aspects,
        {
          bookSynopsis: selectedIdea.synopsis,
          chapterDescription: selectedChapter.chapterDescription
        }
      );
      setAnalysisResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleEditSuggestionRequest = async () => {
    if (!selectedChapter) return;
    setIsAnalyzing(true);
    setAnalysisResult('');
    setError(null);
    try {
      const result = await geminiService.suggestEdits(currentChapterContent);
      setAnalysisResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsAnalyzing(false);
    }
  };
  
  const handleHumanizeText = useCallback(async () => {
    if (!selectedChapter || !currentChapterContent) return;
    setIsHumanizing(true);
    setError(null);
    try {
      const humanizedText = await geminiService.humanizeText(currentChapterContent);
      handleContentChange(humanizedText);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsHumanizing(false);
    }
  }, [selectedChapter, currentChapterContent]);

  const handlePlagiarismCheck = useCallback(async () => {
    if (!selectedChapter || !currentChapterContent) return;
    setIsCheckingPlagiarism(true);
    setAnalysisResult('');
    setError(null);
    try {
      const result = await geminiService.checkPlagiarism(currentChapterContent);
      setAnalysisResult(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsCheckingPlagiarism(false);
    }
  }, [selectedChapter, currentChapterContent]);

  const handleGenerateNewTitle = useCallback(async () => {
    if (!selectedIdea) return;
    setIsGeneratingTitle(true);
    setError(null);
    try {
        const newTitle = await geminiService.generateNewTitle(selectedIdea.synopsis);
        const updatedIdea = { ...selectedIdea, title: newTitle };
        setBookIdeas(prevIdeas => prevIdeas.map(idea => idea.id === selectedIdea.id ? updatedIdea : idea));
        setSelectedIdea(updatedIdea);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingTitle(false);
    }
  }, [selectedIdea]);

  const handleGenerateCoverIdeas = useCallback(async () => {
    if (!selectedIdea) return;
    setIsGeneratingCoverIdeas(true);
    setError(null);
    try {
        const ideas = await geminiService.generateCoverIdeas(selectedIdea.title, selectedIdea.synopsis);
        setModalTitle("Book Cover Ideas");
        setModalContent(
            <ul className="space-y-4">
                {ideas.map((idea, index) => (
                    <li key={index} className="p-3 bg-gray-700/50 rounded-lg">
                        <p className="text-gray-300">{idea}</p>
                    </li>
                ))}
            </ul>
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingCoverIdeas(false);
    }
  }, [selectedIdea]);

  const handleGenerateCoverImage = useCallback(async () => {
    if (!selectedIdea) return;
    setIsGeneratingCoverImage(true);
    setError(null);
    try {
        const base64Image = await geminiService.generateCoverImage(selectedIdea.title, selectedIdea.synopsis, genre);
        setModalTitle("Generated Book Cover");
        setModalContent(
            <div>
                <img 
                    src={`data:image/png;base64,${base64Image}`} 
                    alt={`AI-generated cover for ${selectedIdea.title}`}
                    className="w-full h-auto rounded-lg"
                />
                <p className="text-sm text-gray-400 mt-4">
                    This is a visual concept for your book cover. You can use this as inspiration when working with a designer.
                </p>
            </div>
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingCoverImage(false);
    }
  }, [selectedIdea, genre]);

  const handleGenerateAmazonDetails = useCallback(async () => {
    if (!selectedIdea) return;
    setIsGeneratingAmazonDetails(true);
    setError(null);
    try {
        const details: AmazonKDPDetails = await geminiService.generateAmazonDetails(selectedIdea.title, selectedIdea.synopsis);
        setModalTitle("Amazon KDP Details");
        setModalContent(
            <div className="space-y-6 text-gray-300 prose prose-invert max-w-none">
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Book Description</h3>
                    <div className="p-3 bg-gray-700/50 rounded-lg" dangerouslySetInnerHTML={{ __html: details.description.replace(/\n/g, '<br />') }} />
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Keywords</h3>
                    <ul className="list-disc list-inside ml-4">
                        {details.keywords.map((kw, i) => <li key={i}>{kw}</li>)}
                    </ul>
                </div>
                <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Categories</h3>
                    <ul className="list-disc list-inside ml-4">
                        {details.categories.map((cat, i) => <li key={i}>{cat}</li>)}
                    </ul>
                </div>
            </div>
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingAmazonDetails(false);
    }
  }, [selectedIdea]);
  
  const handleGenerateTrilogy = useCallback(async () => {
    if (!selectedIdea) return;
    setIsGeneratingTrilogy(true);
    setError(null);
    try {
        const trilogyBooks: TrilogyBook[] = await geminiService.generateTrilogySequence(selectedIdea.title, selectedIdea.synopsis);
        setModalTitle("Trilogy Sequence Outline");
        setModalContent(
            <div className="space-y-6">
                {trilogyBooks.sort((a, b) => a.bookNumber - b.bookNumber).map((book) => (
                    <div key={book.bookNumber} className="p-4 bg-gray-700/50 rounded-lg">
                        <h3 className="text-xl font-bold text-indigo-300 mb-2">Book {book.bookNumber}: {book.title}</h3>
                        <p className="text-gray-300 whitespace-pre-wrap">{book.synopsis}</p>
                    </div>
                ))}
            </div>
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingTrilogy(false);
    }
  }, [selectedIdea]);

  return (
    <div className="flex flex-col h-screen font-sans bg-gray-900 text-gray-200">
      <header className="flex items-center justify-between p-4 border-b border-gray-700 bg-gray-800/50 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <SparklesIcon className="w-8 h-8 text-indigo-400" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Mojo Book Writer AI</h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
            <div className="text-center">
                <div className="text-lg font-bold text-white">{totalWordCount.toLocaleString()}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Words</div>
            </div>
            <div className="text-center">
                <div className="text-lg font-bold text-white">{totalPages.toLocaleString()}</div>
                <div className="text-xs text-gray-400 uppercase tracking-wider">Pages (Est.)</div>
            </div>
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
              favoriteTopics={favoriteTopics}
              onTopicsChange={setFavoriteTopics}
            />
          </div>
          <div className="col-span-12 md:col-span-4 lg:col-span-5 xl:col-span-4 border-r border-gray-700 overflow-y-auto">
            <MainContent
              idea={selectedIdea}
              chapters={chapters}
              selectedChapterId={selectedChapter?.id}
              onSelectChapter={handleSelectChapter}
              onGenerateOutline={handleGenerateOutline}
              isLoadingOutline={isLoadingOutline}
              onGenerateNewTitle={handleGenerateNewTitle}
              isGeneratingTitle={isGeneratingTitle}
              onGenerateCoverIdeas={handleGenerateCoverIdeas}
              isGeneratingCoverIdeas={isGeneratingCoverIdeas}
              onGenerateCoverImage={handleGenerateCoverImage}
              isGeneratingCoverImage={isGeneratingCoverImage}
              onGenerateAmazonDetails={handleGenerateAmazonDetails}
              isGeneratingAmazonDetails={isGeneratingAmazonDetails}
              onGenerateTrilogy={handleGenerateTrilogy}
              isGeneratingTrilogy={isGeneratingTrilogy}
            />
          </div>
          <div className="col-span-12 md:col-span-5 lg:col-span-5 xl:col-span-5 flex flex-col overflow-y-auto">
            <EditorPanel
              chapter={selectedChapter}
              content={currentChapterContent}
              onContentChange={handleContentChange}
              onAnalyze={handleAnalysisRequest}
              onSuggestEdits={handleEditSuggestionRequest}
              analysisResult={analysisResult}
              isAnalyzing={isAnalyzing}
              onGenerateContent={handleGenerateContent}
              isGeneratingContent={isGeneratingContent}
              onHumanize={handleHumanizeText}
              isHumanizing={isHumanizing}
              onCheckPlagiarism={handlePlagiarismCheck}
              isCheckingPlagiarism={isCheckingPlagiarism}
            />
          </div>
        </div>
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={modalTitle}>
        {modalContent}
      </Modal>
    </div>
  );
};

export default App;