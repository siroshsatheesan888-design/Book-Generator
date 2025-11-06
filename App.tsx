
import React, { useState, useCallback, useMemo, useRef } from 'react';
import type { BookIdea, Chapter, ChapterConnection, AmazonKDPDetails, TrilogyBook, ContentHistory } from './types';
import * as geminiService from './services/geminiService';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import EditorPanel from './components/EditorPanel';
import Modal from './components/Modal';
import ConnectionManagerModal from './components/ConnectionManagerModal';
import { SparklesIcon } from './components/icons/SparklesIcon';
import PdfPreviewModal from './components/PdfPreviewModal';
import Resizer from './components/Resizer';

// FIX: Moved simpleMarkdownToHtml outside of the component as it is a pure function and does not depend on component state.
const simpleMarkdownToHtml = (markdown: string): string => {
  if (!markdown) return '';
  // Basic conversion, can be expanded
  let html = markdown
      .replace(/</g, '&lt;').replace(/>/g, '&gt;') // Escape HTML
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // Italic
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img src="$2" alt="$1" style="max-width: 80%; margin: 1em auto; display: block; border: 1px solid #ccc;" />'); // Image
  
  // Wrap paragraphs
  return html.split(/\n\s*\n/).map(p => p.trim()).filter(p => p).map(p => {
    if (p.startsWith('<img')) {
      return p;
    }
    return `<p>${p.replace(/\n/g, '<br>')}</p>`;
  }).join('');
};

const generateBookHtml = (
    idea: BookIdea, 
    chapters: Chapter[], 
    chapterContents: Map<string, ContentHistory>, 
    coverImageBase64: string | null
): string => {
    return `
        <html>
            <head>
                <title>Export: ${idea.title}</title>
                <style>
                    /* General Body and Print Styles */
                    body { 
                        font-family: 'Times New Roman', Times, serif; 
                        line-height: 1.6; 
                        color: #000; 
                        margin: 0;
                    }
                    @media print {
                        @page {
                            size: A4;
                            margin: 2.5cm;
                            @bottom-center {
                                content: counter(page);
                                font-family: 'Times New Roman', Times, serif; 
                                font-size: 10pt;
                            }
                        }
                    }
                    h1, h2, h3 { 
                        font-family: 'Garamond', serif; 
                        font-weight: bold;
                        page-break-after: avoid;
                    }
                    p {
                        margin: 0 0 1em 0;
                        text-align: justify;
                        text-indent: 1.5em; /* Indent paragraphs */
                    }
                    .chapter-content p:first-of-type {
                        text-indent: 0; /* No indent on first paragraph of a chapter */
                    }
                    em {
                        font-style: italic;
                    }
                    /* Page Break Utility */
                    .page-break {
                        page-break-before: always;
                    }
                    /* Cover Page */
                    .cover-page {
                        display: flex;
                        flex-direction: column;
                        justify-content: center;
                        align-items: center;
                        text-align: center;
                        height: 100vh;
                        page-break-after: always;
                    }
                    .cover-image {
                        max-width: 80%;
                        max-height: 60vh;
                        object-fit: contain;
                        margin-bottom: 2em;
                        border: 1px solid #ccc;
                    }
                    .cover-title {
                        font-size: 3em;
                        font-weight: bold;
                        margin: 0;
                    }
                    /* Table of Contents */
                    .toc-page {
                        page-break-after: always;
                    }
                    .toc-title {
                        text-align: center;
                        font-size: 2.5em;
                        margin-bottom: 1.5em;
                    }
                    .toc-list {
                        list-style: none;
                        padding: 0;
                        margin: 0 auto;
                        max-width: 80%;
                    }
                    .toc-item {
                        font-size: 1.2em;
                        line-height: 1.5;
                        padding-bottom: 0.5em;
                        margin-bottom: 0.5em;
                        border-bottom: 1px dotted #888;
                    }
                    .toc-item a {
                        text-decoration: none;
                        color: inherit;
                        display: flex;
                        justify-content: space-between;
                        align-items: baseline;
                        gap: 1em;
                    }
                    .toc-item a > span {
                        flex-shrink: 1;
                        overflow: hidden;
                        text-overflow: ellipsis;
                        white-space: nowrap;
                    }
                    .toc-item a::after {
                        content: target-counter(attr(href), page);
                        font-weight: normal;
                        flex-shrink: 0;
                    }
                    /* Chapter Styling */
                    .chapter-title { 
                        font-size: 2.5em; 
                        text-align: center;
                        margin-top: 1em; 
                        margin-bottom: 2em;
                    }
                </style>
            </head>
            <body>
                <div class="cover-page">
                    ${coverImageBase64 ? `<img src="data:image/png;base64,${coverImageBase64}" alt="Book Cover" class="cover-image" />` : ''}
                    <h1 class="cover-title">${idea.title}</h1>
                </div>

                <div class="toc-page">
                    <h2 class="toc-title">Table of Contents</h2>
                    <ul class="toc-list">
                    ${chapters.map((chapter, index) => `
                        <li class="toc-item">
                            <a href="#chapter-${chapter.id}">
                                <span>Chapter ${index + 1}: ${chapter.chapterTitle}</span>
                            </a>
                        </li>
                    `).join('')}
                    </ul>
                </div>

                ${chapters.map((chapter, index) => `
                    <div class="page-break">
                        <h2 id="chapter-${chapter.id}" class="chapter-title">Chapter ${index + 1}: ${chapter.chapterTitle}</h2>
                        <div class="chapter-content">
                            ${simpleMarkdownToHtml(chapterContents.get(chapter.id)?.present || '<em>No content written for this chapter.</em>')}
                        </div>
                    </div>
                `).join('')}
            </body>
        </html>
    `;
};

const App: React.FC = () => {
  const [bookIdeas, setBookIdeas] = useState<BookIdea[]>([]);
  const [selectedIdea, setSelectedIdea] = useState<BookIdea | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  
  const [chapterContents, setChapterContents] = useState<Map<string, ContentHistory>>(new Map());
  const [analysisResult, setAnalysisResult] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [genre, setGenre] = useState('Fantasy');
  const [favoriteTopics, setFavoriteTopics] = useState<string[]>([]);
  const [numChaptersToGenerate, setNumChaptersToGenerate] = useState(12);

  // Resizable Panes State
  const mainContainerRef = useRef<HTMLElement>(null);
  const [paneWidths, setPaneWidths] = useState([25, 35, 40]);

  // Loading states
  const [isLoadingIdeas, setIsLoadingIdeas] = useState(false);
  const [isLoadingOutline, setIsLoadingOutline] = useState(false);
  const [isGeneratingContent, setIsGeneratingContent] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isHumanizing, setIsHumanizing] = useState(false);
  const [isFixingGrammar, setIsFixingGrammar] = useState(false);
  const [isCheckingPlagiarism, setIsCheckingPlagiarism] = useState(false);
  const [isGeneratingTitle, setIsGeneratingTitle] = useState(false);
  const [isGeneratingCoverIdeas, setIsGeneratingCoverIdeas] = useState(false);
  const [isGeneratingCoverImage, setIsGeneratingCoverImage] = useState(false);
  const [isGeneratingChapterImage, setIsGeneratingChapterImage] = useState(false);
  const [isGeneratingAmazonDetails, setIsGeneratingAmazonDetails] = useState(false);
  const [isGeneratingTrilogy, setIsGeneratingTrilogy] = useState(false);
  const [isAnalyzingManuscript, setIsAnalyzingManuscript] = useState(false);
  const [isAnalyzingFormatting, setIsAnalyzingFormatting] = useState(false);
  
  // Modal State
  const [modalContent, setModalContent] = useState<React.ReactNode>(null);
  const [modalTitle, setModalTitle] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [connectionModalChapter, setConnectionModalChapter] = useState<Chapter | null>(null);
  
  // Chapter Management State
  const [isEditingChapters, setIsEditingChapters] = useState(false);

  // Export state
  const [coverImageBase64, setCoverImageBase64] = useState<string | null>(null);
  const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
  const [pdfPreviewHtml, setPdfPreviewHtml] = useState('');

  const { totalWordCount, totalPages } = useMemo(() => {
    let count = 0;
    for (const history of chapterContents.values()) {
        // filter(Boolean) handles empty strings from multiple spaces
        count += history.present.trim().split(/\s+/).filter(Boolean).length;
    }
    return {
        totalWordCount: count,
        totalPages: Math.ceil(count / 250),
    };
  }, [chapterContents]);

  const handleMouseDown = useCallback((e: React.MouseEvent, index: number) => {
    e.preventDefault();

    const startX = e.clientX;
    const startWidths = paneWidths;
    const container = mainContainerRef.current;

    if (!container) return;

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX;
      const containerWidth = container.offsetWidth;
      const deltaPercent = (deltaX / containerWidth) * 100;
      
      const leftPaneIndex = index;
      const rightPaneIndex = index + 1;
      
      const totalPercent = startWidths[leftPaneIndex] + startWidths[rightPaneIndex];
      
      let newLeftPercent = startWidths[leftPaneIndex] + deltaPercent;
      let newRightPercent = startWidths[rightPaneIndex] - deltaPercent;

      const minPixels = [250, 300, 350];
      const minLeftPixels = minPixels[leftPaneIndex];
      const minRightPixels = minPixels[rightPaneIndex];

      const newLeftPixels = (newLeftPercent / 100) * containerWidth;
      const newRightPixels = (newRightPercent / 100) * containerWidth;
      
      if (newLeftPixels < minLeftPixels) {
        newLeftPercent = (minLeftPixels / containerWidth) * 100;
        newRightPercent = totalPercent - newLeftPercent;
      } else if (newRightPixels < minRightPixels) {
        newRightPercent = (minRightPixels / containerWidth) * 100;
        newLeftPercent = totalPercent - newRightPercent;
      }
      
      const finalWidths = [...startWidths];
      finalWidths[leftPaneIndex] = newLeftPercent;
      finalWidths[rightPaneIndex] = newRightPercent;
      
      setPaneWidths(finalWidths);
    };

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  }, [paneWidths]);

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

  // FIX: Wrapped handleSelectIdea in useCallback for performance optimization, as it's passed as a prop.
  const handleSelectIdea = useCallback((idea: BookIdea) => {
    setSelectedIdea(idea);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    setIsEditingChapters(false);
    setCoverImageBase64(null); // Reset cover when idea changes
  }, []);

  const handleGenerateOutline = useCallback(async () => {
    if (!selectedIdea) return;
    setIsLoadingOutline(true);
    setError(null);
    setChapters([]);
    setSelectedChapter(null);
    setAnalysisResult('');
    try {
      const generatedChapters = await geminiService.generateOutline(selectedIdea.title, selectedIdea.synopsis, numChaptersToGenerate);
      setChapters(generatedChapters);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsLoadingOutline(false);
    }
  }, [selectedIdea, numChaptersToGenerate]);

  const handleSelectChapter = useCallback((chapter: Chapter) => {
    if (isEditingChapters) return; // Don't select if in edit mode
    // Check local storage for saved content before setting the chapter
    if (!chapterContents.has(chapter.id)) {
      const savedContent = localStorage.getItem(`mojo-book-writer-chapter-${chapter.id}`) || '';
      // Pre-populate the content state for this chapter
      setChapterContents(prev => new Map(prev).set(chapter.id, {
        past: [],
        present: savedContent,
        future: []
      }));
    }
    setSelectedChapter(chapter);
    setAnalysisResult('');
  }, [chapterContents, isEditingChapters]);
  
  const handleContentChange = useCallback((content: string) => {
    if (selectedChapter) {
      setChapterContents(prev => {
        const newMap = new Map(prev);
        const history = newMap.get(selectedChapter.id) || { past: [], present: '', future: [] };
        
        if (content === history.present) {
          return prev; // No change, no need to update history
        }

        const newPast = [...history.past, history.present];

        newMap.set(selectedChapter.id, {
          past: newPast,
          present: content,
          future: [], // New user edit clears the redo stack
        });
        return newMap;
      });
    }
  }, [selectedChapter]);
  
  const handleGenerateContent = useCallback(async () => {
    if (!selectedIdea || !selectedChapter) return;
    
    const currentContent = chapterContents.get(selectedChapter.id)?.present || '';
    if (currentContent.trim().length > 0) {
        if (!window.confirm('This will replace the existing content in the editor. Are you sure you want to proceed?')) {
            return; // User cancelled
        }
    }

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
  }, [selectedIdea, selectedChapter, handleContentChange, chapterContents]);

  const currentChapterHistory = useMemo(() => selectedChapter ? chapterContents.get(selectedChapter.id) : undefined, [selectedChapter, chapterContents]);
  const currentChapterContent = currentChapterHistory?.present ?? '';
  const canUndo = (currentChapterHistory?.past.length ?? 0) > 0;
  const canRedo = (currentChapterHistory?.future.length ?? 0) > 0;


  // FIX: Wrapped handleAnalysisRequest in useCallback for performance optimization and to fix scoping issues.
  const handleAnalysisRequest = useCallback(async (aspects: string[]) => {
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
  }, [selectedChapter, selectedIdea, currentChapterContent]);

  // FIX: Wrapped handleEditSuggestionRequest in useCallback for performance optimization and to fix scoping issues.
  const handleEditSuggestionRequest = useCallback(async () => {
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
  }, [selectedChapter, currentChapterContent]);
  
  const handleHumanizeText = useCallback(async () => {
    if (!selectedChapter || !currentChapterContent) return;
    
    if (currentChapterContent.trim().length > 0) {
      if (!window.confirm('This will replace the existing content in the editor. Are you sure you want to proceed?')) {
          return; // User cancelled
      }
    }
    
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
  }, [selectedChapter, currentChapterContent, handleContentChange]);

  const handleApplyGrammarFixes = useCallback(async () => {
    if (!selectedChapter || !currentChapterContent) return;
    
    if (currentChapterContent.trim().length > 0) {
      if (!window.confirm('This will replace the existing content in the editor with a grammatically corrected version. Are you sure you want to proceed?')) {
          return; // User cancelled
      }
    }
    
    setIsFixingGrammar(true);
    setError(null);
    try {
      const fixedText = await geminiService.applyGrammarFixes(currentChapterContent);
      handleContentChange(fixedText);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setIsFixingGrammar(false);
    }
  }, [selectedChapter, currentChapterContent, handleContentChange]);

  const handleUndo = useCallback(() => {
    if (!selectedChapter) return;
    setChapterContents(prev => {
      const newMap = new Map(prev);
      const history = newMap.get(selectedChapter.id);

      if (!history || history.past.length === 0) {
        return prev;
      }

      const previousState = history.past[history.past.length - 1];
      const newPast = history.past.slice(0, history.past.length - 1);

      newMap.set(selectedChapter.id, {
        past: newPast,
        present: previousState,
        future: [history.present, ...history.future],
      });
      return newMap;
    });
  }, [selectedChapter]);

  const handleRedo = useCallback(() => {
    if (!selectedChapter) return;
    setChapterContents(prev => {
      const newMap = new Map(prev);
      const history = newMap.get(selectedChapter.id);

      if (!history || history.future.length === 0) {
        return prev;
      }
      
      const nextState = history.future[0];
      const newFuture = history.future.slice(1);

      newMap.set(selectedChapter.id, {
        past: [...history.past, history.present],
        present: nextState,
        future: newFuture,
      });
      return newMap;
    });
  }, [selectedChapter]);


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
    setIsModalOpen(true);
    setModalTitle("Generating Taglines...");
    setModalContent(
      <div className="text-center p-4">
        <SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-indigo-400" />
        <p className="mt-4 text-gray-300">Coming up with some catchy taglines...</p>
      </div>
    );

    try {
      // Step 1: Generate Taglines
      const taglines = await geminiService.generateTaglines(selectedIdea.title, selectedIdea.synopsis);

      // Step 2: Define the handler for when a user selects a tagline
      const handleTaglineSelect = async (tagline: string) => {
        setModalTitle("Generating Your Cover...");
        setModalContent(
           <div className="text-center p-4">
            <SparklesIcon className="w-12 h-12 mx-auto animate-pulse text-indigo-400" />
            <p className="mt-4 text-gray-300">The AI is designing your cover with the title and tagline. This may take a moment...</p>
          </div>
        );

        try {
          const base64Image = await geminiService.generateCoverImage(selectedIdea.title, selectedIdea.synopsis, genre, tagline);
          setCoverImageBase64(base64Image);
          setModalTitle("Generated Book Cover");
          setModalContent(
            <div>
              <img 
                src={`data:image/png;base64,${base64Image}`} 
                alt={`AI-generated cover for ${selectedIdea.title}`}
                className="w-full h-auto rounded-lg"
              />
              <p className="text-sm text-gray-400 mt-4">
                This is a visual concept for your book cover, now with title and tagline. It will be used as the cover page when you export your book.
              </p>
            </div>
          );
        } catch (e) {
          setModalContent(
            <div className="text-center text-red-400 p-4">
              <p>Sorry, an error occurred while generating the image:</p>
              <p className="mt-2 text-sm text-gray-400">{(e as Error).message}</p>
            </div>
          );
        }
      };

      // Step 3: Display tagline options
      setModalTitle("Select a Tagline for Your Cover");
      setModalContent(
        <div className="space-y-4">
          <p className="text-gray-400">Choose a tagline to feature on your book cover alongside the title. The AI will then generate the full cover image.</p>
          <div className="flex flex-col gap-3">
            {taglines.map((tag, index) => (
              <button 
                key={index}
                onClick={() => handleTaglineSelect(tag)}
                className="w-full text-left p-3 bg-gray-700/50 rounded-lg hover:bg-indigo-500/30 transition-colors"
              >
                <p className="text-white">{tag}</p>
              </button>
            ))}
          </div>
        </div>
      );
    } catch (e) {
      setError((e as Error).message);
      setIsModalOpen(false);
      setIsGeneratingCoverImage(false);
    }
  }, [selectedIdea, genre]);

  const handleGenerateChapterImage = useCallback(async () => {
    if (!selectedIdea || !selectedChapter || !currentChapterContent) return;
    setIsGeneratingChapterImage(true);
    setError(null);
    try {
        const base64Image = await geminiService.generateChapterImage(
            selectedIdea.title,
            selectedIdea.synopsis,
            selectedChapter.chapterTitle,
            currentChapterContent,
            genre
        );
        
        const handleInsert = () => {
            const newContent = currentChapterContent + `\n\n![An illustration for the chapter "${selectedChapter.chapterTitle}"](data:image/png;base64,${base64Image})`;
            handleContentChange(newContent);
            setIsModalOpen(false);
        };

        setModalTitle("Generated Chapter Image");
        setModalContent(
            <div>
                <img 
                    src={`data:image/png;base64,${base64Image}`} 
                    alt={`AI-generated image for ${selectedChapter.chapterTitle}`}
                    className="w-full h-auto rounded-lg"
                />
                <p className="text-sm text-gray-400 mt-4">
                    A visual interpretation of your chapter's content. You can insert this into your text.
                </p>
                <button onClick={handleInsert} className="mt-4 px-4 py-2 text-sm font-semibold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700">
                    Insert Image at End of Chapter
                </button>
            </div>
        );
        setIsModalOpen(true);

    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsGeneratingChapterImage(false);
    }
}, [selectedIdea, selectedChapter, currentChapterContent, genre, handleContentChange]);

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

  const handleAnalyzeFullManuscript = useCallback(async () => {
    if (!selectedIdea) return;
    
    const chaptersWithContent = chapters
      .map(chapter => ({
        chapterTitle: chapter.chapterTitle,
        chapterContent: chapterContents.get(chapter.id)?.present || '',
      }))
      .filter(c => c.chapterContent.trim() !== '');

    if (chaptersWithContent.length === 0) {
        setError("There is no written content to analyze. Please write some content in your chapters first.");
        return;
    }
    
    setIsAnalyzingManuscript(true);
    setError(null);

    try {
        const analysis = await geminiService.analyzeFullManuscript(
            selectedIdea.title,
            selectedIdea.synopsis,
            chaptersWithContent
        );

        setModalTitle("Full Manuscript Analysis");
        const analysisResultHtml = analysis.replace(/\n/g, '<br />');
        setModalContent(
            <div 
                className="prose prose-invert max-w-none text-gray-300" 
                dangerouslySetInnerHTML={{ __html: analysisResultHtml }}
            />
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsAnalyzingManuscript(false);
    }
  }, [selectedIdea, chapters, chapterContents]);

  const handleAnalyzeBookForFormatting = useCallback(async () => {
    if (!selectedIdea) return;
    
    const chaptersWithContent = chapters
      .map(chapter => ({
        chapterTitle: chapter.chapterTitle,
        chapterContent: chapterContents.get(chapter.id)?.present || '',
      }))
      .filter(c => c.chapterContent.trim() !== '');

    if (chaptersWithContent.length === 0) {
        setError("There is no written content to analyze. Please write some content in your chapters first.");
        return;
    }
    
    setIsAnalyzingFormatting(true);
    setError(null);

    try {
        const analysis = await geminiService.analyzeBookForFormatting(
            selectedIdea.title,
            selectedIdea.synopsis,
            genre,
            chaptersWithContent
        );

        setModalTitle("6\" x 9\" Book Format Analysis");
        const analysisResultHtml = analysis.replace(/\n/g, '<br />');
        setModalContent(
            <div 
                className="prose prose-invert max-w-none text-gray-300" 
                dangerouslySetInnerHTML={{ __html: analysisResultHtml }}
            />
        );
        setIsModalOpen(true);
    } catch (e) {
        setError((e as Error).message);
    } finally {
        setIsAnalyzingFormatting(false);
    }
  }, [selectedIdea, chapters, chapterContents, genre]);

  const handleSaveContent = useCallback(() => {
    if (selectedChapter) {
        const contentToSave = chapterContents.get(selectedChapter.id)?.present || '';
        localStorage.setItem(`mojo-book-writer-chapter-${selectedChapter.id}`, contentToSave);
    }
  }, [selectedChapter, chapterContents]);

  const handleRevertContent = useCallback(() => {
      if (selectedChapter) {
          if (window.confirm('Are you sure you want to revert all changes since the last save? This cannot be undone.')) {
              const savedContent = localStorage.getItem(`mojo-book-writer-chapter-${selectedChapter.id}`) || '';
              setChapterContents(prev => new Map(prev).set(selectedChapter.id, {
                past: [],
                present: savedContent,
                future: [],
              }));
          }
      }
  }, [selectedChapter]);

  const handleRenameChapter = useCallback((chapterId: string, newTitle: string) => {
    setChapters(prev => prev.map(c => c.id === chapterId ? { ...c, chapterTitle: newTitle } : c));
  }, []);

  const handleReorderChapters = useCallback((reorderedChapters: Chapter[]) => {
      setChapters(reorderedChapters);
  }, []);

  const handleDeleteChapter = useCallback((chapterId: string) => {
    if (window.confirm('Are you sure you want to delete this chapter, its content, and all connections to it? This cannot be undone.')) {
        if (selectedChapter?.id === chapterId) {
            setSelectedChapter(null);
        }
        // Remove the chapter itself and any connections pointing to it from other chapters
        setChapters(prev => 
            prev.filter(c => c.id !== chapterId)
                .map(c => ({
                    ...c,
                    connections: c.connections.filter(conn => conn.targetId !== chapterId)
                }))
        );
        setChapterContents(prev => {
            const newContents = new Map(prev);
            newContents.delete(chapterId);
            return newContents;
        });
        localStorage.removeItem(`mojo-book-writer-chapter-${chapterId}`);
    }
  }, [selectedChapter]);

  const handleUpdateConnections = useCallback((sourceChapterId: string, newConnections: ChapterConnection[]) => {
    setChapters(prev => prev.map(c => c.id === sourceChapterId ? { ...c, connections: newConnections } : c));
  }, []);

  const handleOpenPdfPreview = useCallback(() => {
    if (!selectedIdea) return;
    
    const html = generateBookHtml(selectedIdea, chapters, chapterContents, coverImageBase64);
    setPdfPreviewHtml(html);
    setIsPdfPreviewOpen(true);
  }, [selectedIdea, chapters, chapterContents, coverImageBase64]);

  const handleModalClose = () => {
    setIsModalOpen(false);
    // Reset any states that might be left hanging by an interrupted modal flow.
    if (isGeneratingCoverImage) setIsGeneratingCoverImage(false);
  };


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

      <main className="flex flex-1 overflow-hidden" ref={mainContainerRef}>
        <div style={{ flex: `0 0 ${paneWidths[0]}%`, minWidth: '250px' }} className="h-full overflow-y-auto">
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
        <Resizer onMouseDown={(e) => handleMouseDown(e, 0)} />
        <div style={{ flex: `0 0 ${paneWidths[1]}%`, minWidth: '300px' }} className="h-full overflow-y-auto">
          <MainContent
            idea={selectedIdea}
            chapters={chapters}
            chapterContents={chapterContents}
            selectedChapterId={selectedChapter?.id}
            onSelectChapter={handleSelectChapter}
            onGenerateOutline={handleGenerateOutline}
            isLoadingOutline={isLoadingOutline}
            numChaptersToGenerate={numChaptersToGenerate}
            onNumChaptersChange={setNumChaptersToGenerate}
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
            onAnalyzeFullManuscript={handleAnalyzeFullManuscript}
            isAnalyzingManuscript={isAnalyzingManuscript}
            onAnalyzeForFormatting={handleAnalyzeBookForFormatting}
            isAnalyzingFormatting={isAnalyzingFormatting}
            isEditingChapters={isEditingChapters}
            onToggleChapterEditing={() => setIsEditingChapters(prev => !prev)}
            onRenameChapter={handleRenameChapter}
            onReorderChapters={handleReorderChapters}
            onDeleteChapter={handleDeleteChapter}
            onExportToPdf={handleOpenPdfPreview}
            onOpenConnectionManager={(chapter) => setConnectionModalChapter(chapter)}
          />
        </div>
        <Resizer onMouseDown={(e) => handleMouseDown(e, 1)} />
        <div style={{ flex: `1 1 ${paneWidths[2]}%`, minWidth: '350px' }} className="h-full flex flex-col overflow-y-auto">
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
            onApplyGrammarFixes={handleApplyGrammarFixes}
            isFixingGrammar={isFixingGrammar}
            // FIX: Corrected a typo in the function name passed to the onCheckPlagiarism prop, changing handleCheckPlagiarism to the correctly defined handlePlagiarismCheck.
            onCheckPlagiarism={handlePlagiarismCheck}
            isCheckingPlagiarism={isCheckingPlagiarism}
            onGenerateChapterImage={handleGenerateChapterImage}
            isGeneratingChapterImage={isGeneratingChapterImage}
            canUndo={canUndo}
            canRedo={canRedo}
            onUndo={handleUndo}
            onRedo={handleRedo}
            onSave={handleSaveContent}
            onRevert={handleRevertContent}
          />
        </div>
      </main>
      <Modal isOpen={isModalOpen} onClose={handleModalClose} title={modalTitle}>
        {modalContent}
      </Modal>
      <PdfPreviewModal
        isOpen={isPdfPreviewOpen}
        onClose={() => setIsPdfPreviewOpen(false)}
        bookHtml={pdfPreviewHtml}
        bookTitle={selectedIdea?.title || ''}
      />
      {connectionModalChapter && (
        <ConnectionManagerModal
          isOpen={!!connectionModalChapter}
          onClose={() => setConnectionModalChapter(null)}
          sourceChapter={connectionModalChapter}
          allChapters={chapters}
          onSave={handleUpdateConnections}
        />
      )}
    </div>
  );
};

export default App;
