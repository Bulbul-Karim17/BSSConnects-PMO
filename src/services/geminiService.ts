import { GoogleGenAI, Type } from "@google/genai";
import { Project, Task, RAIDItem, Milestone } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function analyzeProjectFile(fileBase64: string, mimeType: string) {
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
    const response = await ai.models.generateContent({
      model,
      contents: [
        {
          parts: [
            { text: prompt },
            { inlineData: { data: fileBase64, mimeType } }
          ]
        }
      ],
      config: {
        responseMimeType: "application/json",
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
