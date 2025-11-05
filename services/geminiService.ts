import { GoogleGenAI, Type } from "@google/genai";
import type { BookIdea, Chapter, AmazonKDPDetails } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    console.error("Error generating book ideas:", error);
    throw new Error("Failed to generate book ideas. Please check your API key and try again.");
  }
};

export const generateOutline = async (title: string, synopsis: string): Promise<Chapter[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Given the book title "${title}" and synopsis "${synopsis}", generate a list of 12 chapter titles that outline a coherent story arc. For each chapter, provide a one-sentence description of its content.`,
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
    return chapters.map((chapter: Omit<Chapter, 'id'>) => ({
      ...chapter,
      id: self.crypto.randomUUID(),
    }));
  } catch (error) {
    console.error("Error generating chapters:", error);
    throw new Error("Failed to generate chapters.");
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
    console.error("Error generating chapter content:", error);
    throw new Error("Failed to generate chapter content.");
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
        console.error("Error generating new title:", error);
        throw new Error("Failed to generate a new title.");
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
        console.error("Error generating cover ideas:", error);
        throw new Error("Failed to generate cover ideas.");
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
        console.error("Error generating Amazon details:", error);
        throw new Error("Failed to generate Amazon KDP details.");
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
    console.error("Error analyzing content:", error);
    throw new Error("Failed to analyze content.");
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
    console.error("Error suggesting edits:", error);
    throw new Error("Failed to suggest edits.");
  }
};