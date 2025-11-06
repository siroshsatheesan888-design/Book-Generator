import { GoogleGenAI, Type } from "@google/genai";
import type { BookIdea, Chapter, AmazonKDPDetails, TrilogyBook } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// FIX: Added a centralized error handler to provide user-friendly messages for common API issues like rate limiting.
const handleGeminiError = (error: unknown, defaultMessage: string): Error => {
  console.error(defaultMessage, error);
  if (error instanceof Error) {
    const message = error.message;
    // Check for specific error strings related to rate limiting or resource exhaustion.
    if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED') || message.toLowerCase().includes('rate limit')) {
      return new Error("Rate limit exceeded. You've made too many requests in a short time. Please wait a moment before trying again. For higher limits, you can add your own Gemini API key in the settings.");
    }
    // Check for API key issues
    if (message.toLowerCase().includes('api key not valid')) {
       return new Error("Your Gemini API Key is not valid. Please check it in the settings or get a new one from Google AI Studio.");
    }
  }
  // Generic fallback error
  return new Error(`${defaultMessage}. Please check your connection and API key.`);
}

export const generateBookIdeas = async (genre: string, topics: string[]): Promise<BookIdea[]> => {
  try {
    let prompt = `Generate 3 unique book ideas in the ${genre} genre. For each idea, provide a compelling title and a one-paragraph synopsis.`;
    if (topics.length > 0) {
      prompt += ` The ideas should incorporate some of the user's favorite topics: ${topics.join(', ')}.`;
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              title: {
                type: Type.STRING,
                description: 'The title of the book idea.',
              },
              synopsis: {
                type: Type.STRING,
                description: 'A one-paragraph synopsis of the book idea.',
              },
            },
            required: ["title", "synopsis"],
          },
        },
      },
    });

    const ideas = JSON.parse(response.text);
    return ideas.map((idea: Omit<BookIdea, 'id'>) => ({
      ...idea,
      id: self.crypto.randomUUID(),
    }));
  } catch (error) {
    throw handleGeminiError(error, "Failed to generate book ideas");
  }
};

export const generateOutline = async (title: string, synopsis: string, numberOfChapters: number): Promise<Chapter[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Given the book title "${title}" and synopsis "${synopsis}", generate a list of ${numberOfChapters} chapter titles that outline a coherent story arc. For each chapter, provide a one-sentence description of its content.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              chapterTitle: {
                type: Type.STRING,
                description: 'The title of the chapter.',
              },
              chapterDescription: {
                type: Type.STRING,
                description: 'A one-sentence description of the chapter.',
              },
            },
            required: ["chapterTitle", "chapterDescription"],
          },
        },
      },
    });

    const chapters = JSON.parse(response.text);
    return chapters.map((chapter: Omit<Chapter, 'id' | 'connections'>) => ({
      ...chapter,
      id: self.crypto.randomUUID(),
      connections: [],
    }));
  } catch (error) {
    throw handleGeminiError(error, "Failed to generate chapters");
  }
};

export const generateChapterContent = async (bookTitle: string, bookSynopsis: string, chapterTitle: string, chapterDescription: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `You are a creative writer. Based on the book titled "${bookTitle}" with the synopsis "${bookSynopsis}", write the content for the chapter titled "${chapterTitle}".
      The chapter should focus on: "${chapterDescription}".
      Write a compelling and engaging chapter of about 500-700 words. Use rich descriptions and advance the plot.
      Output the content in markdown format.`,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to generate chapter content");
  }
};

export const generateNewTitle = async (synopsis: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Based on the following synopsis, generate one new, compelling book title. The title should be catchy and genre-appropriate. Only output the title itself, with no extra text or quotation marks.\n\nSynopsis:\n${synopsis}`,
        });
        return response.text.trim();
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate a new title");
    }
};

export const generateCoverIdeas = async (title: string, synopsis: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `For a book titled "${title}" with the synopsis "${synopsis}", generate 4 distinct and visually evocative book cover ideas. For each idea, provide a detailed one-paragraph description focusing on imagery, color palette, and mood.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        ideas: {
                            type: Type.ARRAY,
                            description: "A list of 4 book cover ideas.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["ideas"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.ideas;
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate cover ideas");
    }
};

export const generateTaglines = async (title: string, synopsis: string): Promise<string[]> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: `Generate 4 catchy and genre-appropriate taglines for a book titled "${title}" with the synopsis "${synopsis}". The taglines should be short, intriguing, and suitable for a book cover.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        taglines: {
                            type: Type.ARRAY,
                            description: "A list of 4 book taglines.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["taglines"]
                }
            }
        });
        const result = JSON.parse(response.text);
        return result.taglines;
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate taglines");
    }
};

export const generateCoverImage = async (title: string, synopsis: string, genre: string, tagline: string): Promise<string> => {
    try {
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional, high-quality book cover for a ${genre} novel. The cover must feature the book's title "${title}" using a prominent, stylish, and legible font. It must also include the tagline: "${tagline}" in a smaller, complementary font. The overall imagery should be visually evocative, setting the mood for a story about: "${synopsis}". The typography and art style must be professional and genre-appropriate.`,
            config: {
              numberOfImages: 1,
              aspectRatio: '3:4',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed to produce an image.");
        }

        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate cover image");
    }
};

export const generateChapterImage = async (
    title: string, 
    synopsis: string, 
    chapterTitle: string,
    chapterContent: string,
    genre: string
): Promise<string> => {
    try {
        // Summarize the chapter content if it's too long to ensure a focused prompt
        const contentSummary = chapterContent.length > 1000 
            ? (await ai.models.generateContent({
                model: "gemini-2.5-flash",
                contents: `Summarize the key scene or visual elements from the following text in one sentence for an image generation prompt: ${chapterContent}`
              })).text
            : chapterContent;

        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: `A professional book illustration for a ${genre} novel titled "${title}". The scene is from the chapter "${chapterTitle}". The overall story is about: "${synopsis}". The main focus of the image should be: "${contentSummary}". The style should be evocative and match the genre. Do not include any text, titles, or author names.`,
            config: {
              numberOfImages: 1,
              aspectRatio: '4:3',
            },
        });

        if (!response.generatedImages || response.generatedImages.length === 0) {
            throw new Error("Image generation failed to produce an image.");
        }

        return response.generatedImages[0].image.imageBytes;
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate chapter image");
    }
};


export const generateAmazonDetails = async (title: string, synopsis: string): Promise<AmazonKDPDetails> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-pro",
            contents: `For a book titled "${title}" with the synopsis "${synopsis}", generate details for an Amazon KDP listing. Provide a compelling book description (blurb) of about 150-200 words formatted in markdown for Amazon, 7 relevant keywords, and 3 appropriate BISAC categories.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        description: {
                            type: Type.STRING,
                            description: "A compelling book description (blurb) formatted in markdown."
                        },
                        keywords: {
                            type: Type.ARRAY,
                            description: "An array of 7 relevant keywords.",
                            items: { type: Type.STRING }
                        },
                        categories: {
                            type: Type.ARRAY,
                            description: "An array of 3 appropriate BISAC categories.",
                            items: { type: Type.STRING }
                        }
                    },
                    required: ["description", "keywords", "categories"]
                }
            }
        });
        return JSON.parse(response.text);
    } catch (error) {
        throw handleGeminiError(error, "Failed to generate Amazon KDP details");
    }
};

export const generateTrilogySequence = async (title: string, synopsis: string): Promise<TrilogyBook[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Expand the following book idea into a complete trilogy. For each of the three books, provide a compelling title and a detailed synopsis (at least 3-4 paragraphs) that outlines a full story arc suitable for a novel of at least 200 pages. Ensure the three books form a cohesive series.

      Original Idea Title: "${title}"
      Original Idea Synopsis: "${synopsis}"`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            trilogy: {
              type: Type.ARRAY,
              description: "An array of three books for the trilogy.",
              items: {
                type: Type.OBJECT,
                properties: {
                  bookNumber: {
                    type: Type.INTEGER,
                    description: "The book number in the trilogy (1, 2, or 3).",
                  },
                  title: {
                    type: Type.STRING,
                    description: "The title of this book in the trilogy.",
                  },
                  synopsis: {
                    type: Type.STRING,
                    description: "A detailed synopsis for this book.",
                  },
                },
                required: ["bookNumber", "title", "synopsis"],
              },
            },
          },
          required: ["trilogy"],
        },
      },
    });

    const result = JSON.parse(response.text);
    return result.trilogy;
  } catch (error) {
    throw handleGeminiError(error, "Failed to generate trilogy sequence");
  }
};


export const analyzeContent = async (
  text: string,
  aspects: string[],
  context: { bookSynopsis: string; chapterDescription: string }
): Promise<string> => {
  if (!text.trim()) return "There is no content to analyze.";
  if (aspects.length === 0) return "Please select at least one aspect to analyze.";

  // FIX: Property 'ListFormat' does not exist on type 'typeof Intl'. Replaced Intl.ListFormat with a manual implementation for broader compatibility.
  const aspectsString =
    aspects.length <= 2
      ? aspects.join(' and ')
      : `${aspects.slice(0, -1).join(', ')}, and ${aspects[aspects.length - 1]}`;

  let prompt = `Analyze the following text for ${aspectsString}. Provide a brief, constructive summary of your analysis for each aspect in markdown format.`;

  if (aspects.includes('Plot Consistency')) {
    prompt += `
    
    When analyzing for Plot Consistency, use the following context:
    - Book Synopsis: "${context.bookSynopsis}"
    - Chapter Description: "${context.chapterDescription}"`;
  }

  prompt += `
  
  Text to analyze:
  ---
  ${text}
  ---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to analyze content");
  }
};


export const suggestEdits = async (text: string): Promise<string> => {
  if (!text.trim()) return "There is no content to edit.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert editor. Proofread the following text. Suggest edits to improve grammar, spelling, and flow. Present the suggestions clearly using markdown for emphasis (e.g., bold for additions, strikethrough for deletions).
      
      Text to edit:
      ---
      ${text}
      ---`,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to suggest edits");
  }
};

export const humanizeText = async (text: string): Promise<string> => {
  if (!text.trim()) return "There is no content to humanize.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Rewrite the following text to sound more natural, engaging, and human-like. Vary sentence structure, use more evocative language, and reduce robotic phrasing, while preserving the core meaning and plot points.
      
      Text to humanize:
      ---
      ${text}
      ---`,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to humanize text");
  }
};

export const applyGrammarFixes = async (text: string): Promise<string> => {
  if (!text.trim()) return "There is no content to fix.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `You are an expert editor. Proofread the following text for grammar, spelling, and flow. Return the fully corrected text, incorporating all necessary changes directly. Do not provide a list of suggestions; only output the final, polished version of the text.
      
      Text to fix:
      ---
      ${text}
      ---`,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to apply grammar fixes");
  }
};

export const checkPlagiarism = async (text: string): Promise<string> => {
  if (!text.trim()) return "There is no content to check.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Act as a sophisticated plagiarism checker. Analyze the following text by searching the web for similar content. Provide a concise summary of your findings. If you find any potential matches, list them with the source URL, the source title, and an estimated similarity percentage. If no significant matches are found, state 'No potential plagiarism detected.' Format your entire response in markdown.
      
      Text to check:
      ---
      ${text}
      ---`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to check for plagiarism");
  }
};

export const analyzeFullManuscript = async (
  title: string,
  synopsis: string,
  chapters: Array<{ chapterTitle: string; chapterContent: string }>
): Promise<string> => {
  if (chapters.length === 0) {
    return "There is no content to analyze.";
  }

  const manuscriptContent = chapters.map(c => 
    `--- CHAPTER: ${c.chapterTitle} ---\n${c.chapterContent}`
  ).join('\n\n');

  const prompt = `You are an expert developmental editor. Your task is to analyze a full book manuscript for high-level issues.
  
  The book is titled "${title}" with the following synopsis: "${synopsis}".

  Please review the following chapters and identify any plot holes, character inconsistencies, pacing problems, continuity errors, or unresolved plot threads. 
  
  Provide a detailed report in markdown format. Start with a "Global Issues" section for problems that span multiple chapters. Then, group the rest of your findings by chapter. For each finding, explain the issue clearly and suggest a potential solution.
  
  MANUSCRIPT:
  ---
  ${manuscriptContent}
  ---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to analyze the full manuscript");
  }
};

export const analyzeBookForFormatting = async (
  title: string,
  synopsis: string,
  genre: string,
  chapters: Array<{ chapterTitle: string; chapterContent: string }>
): Promise<string> => {
  if (chapters.length === 0) {
    return "There is no content to analyze.";
  }

  const manuscriptContent = chapters.map(c => 
    `--- CHAPTER: ${c.chapterTitle} ---\n${c.chapterContent}`
  ).join('\n\n');
  
  const wordCount = manuscriptContent.trim().split(/\s+/).filter(Boolean).length;

  const prompt = `You are a book production expert. Your task is to analyze a manuscript to see how it would fit into a standard 6" x 9" trade paperback format.
  
  The book is a ${genre} novel titled "${title}" with the following synopsis: "${synopsis}".
  
  The manuscript has a total word count of approximately ${wordCount} words.

  Please provide a detailed analysis report in markdown format that includes:
  1.  **Estimated Page Count:** Based on the word count, calculate the estimated number of pages for a 6" x 9" book, assuming a standard font size and margin (typically 250-300 words per page).
  2.  **Genre Length Analysis:** Comment on how this length fits within typical expectations for the "${genre}" genre. Is it short, average, or long?
  3.  **Pacing & Structure Suggestions:** Based on the manuscript content, provide actionable suggestions for adjusting the length. Identify specific chapters or sections that could be expanded with more detail or condensed for better pacing.
  4.  **Final Verdict:** A concluding summary of whether the book is well-suited for the 6x9 format as-is, or if adjustments are recommended.
  
  MANUSCRIPT:
  ---
  ${manuscriptContent}
  ---`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    throw handleGeminiError(error, "Failed to analyze the book for formatting");
  }
};