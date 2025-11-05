
import { GoogleGenAI, Type } from "@google/genai";
import type { BookIdea, Chapter } from '../types';

// FIX: Removed `as string` casting as per coding guidelines.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateBookIdeas = async (genre: string): Promise<BookIdea[]> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-pro",
      contents: `Generate 3 unique book ideas in the ${genre} genre. For each idea, provide a compelling title and a one-paragraph synopsis.`,
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

export const generateChapters = async (title: string, synopsis: string): Promise<Chapter[]> => {
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
