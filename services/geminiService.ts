
import { GoogleGenAI, Type } from "@google/genai";
import type { BookIdea, Chapter } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

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

export const analyzeContent = async (text: string): Promise<string> => {
  if (!text.trim()) return "There is no content to analyze.";
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Analyze the following text for tone, pacing, and clarity. Provide a brief, constructive summary of your analysis in markdown format.
      
      Text to analyze:
      ---
      ${text}
      ---`,
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
