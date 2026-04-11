import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task, RAIDItem, Milestone } from "../types";

let ai: GoogleGenAI | null = null;

function getGenAI() {
  if (!ai) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === "MY_GEMINI_API_KEY") {
      console.error("Gemini API Key is missing or invalid. Please check your environment variables.");
      throw new Error("Gemini API Key is not configured correctly. Please set it in the project settings.");
    }
    ai = new GoogleGenAI({ apiKey });
  }
  return ai;
}

export async function analyzeProjectFile(fileBase64: string, mimeType: string) {
  const genAI = getGenAI();
  const model = "gemini-3-flash-preview";

  const prompt = `
    Analyze the attached project document and extract the project details, tasks, RAID items, and milestones.
    Determine if this is an R&D project (Agile/Scrum) or a Delivery project (Waterfall).
    
    Return the data in a strict JSON format matching the following structure:
    {
      "project": {
        "name": "string",
        "description": "string",
        "type": "RD" | "DELIVERY",
        "client": "string",
        "startDate": "YYYY-MM-DD",
        "targetGoLive": "YYYY-MM-DD"
      },
      "tasks": [
        {
          "title": "string",
          "description": "string",
          "status": "BACKLOG" | "TODO" | "IN_PROGRESS" | "DONE" | "BLOCKED",
          "workstream": "string",
          "owner": "string",
          "startDate": "YYYY-MM-DD",
          "endDate": "YYYY-MM-DD",
          "phase": "string"
        }
      ],
      "raid": [
        {
          "type": "RISK" | "ASSUMPTION" | "DEPENDENCY" | "ISSUE",
          "category": "string",
          "description": "string",
          "impact": "LOW" | "MEDIUM" | "HIGH",
          "owner": "string",
          "status": "OPEN" | "CLOSED",
          "mitigation": "string"
        }
      ],
      "milestones": [
        {
          "name": "string",
          "phase": "string",
          "targetDate": "YYYY-MM-DD"
        }
      ]
    }
  `;

  try {
    const response = await genAI.models.generateContent({
      model,
      contents: {
        parts: [
          { text: prompt },
          { inlineData: { data: fileBase64, mimeType } }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            project: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                description: { type: Type.STRING },
                type: { type: Type.STRING, enum: ["RD", "DELIVERY"] },
                client: { type: Type.STRING },
                startDate: { type: Type.STRING },
                targetGoLive: { type: Type.STRING }
              },
              required: ["name", "type"]
            },
            tasks: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["BACKLOG", "TODO", "IN_PROGRESS", "DONE", "BLOCKED"] },
                  workstream: { type: Type.STRING },
                  owner: { type: Type.STRING },
                  startDate: { type: Type.STRING },
                  endDate: { type: Type.STRING },
                  phase: { type: Type.STRING }
                },
                required: ["title"]
              }
            },
            raid: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, enum: ["RISK", "ASSUMPTION", "DEPENDENCY", "ISSUE"] },
                  category: { type: Type.STRING },
                  description: { type: Type.STRING },
                  impact: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
                  owner: { type: Type.STRING },
                  status: { type: Type.STRING, enum: ["OPEN", "CLOSED"] },
                  mitigation: { type: Type.STRING }
                },
                required: ["type", "description"]
              }
            },
            milestones: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  phase: { type: Type.STRING },
                  targetDate: { type: Type.STRING }
                },
                required: ["name"]
              }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error("No response from Gemini");
    }

    return JSON.parse(response.text);
  } catch (error) {
    console.error("Error analyzing project file:", error);
    throw error;
  }
}
