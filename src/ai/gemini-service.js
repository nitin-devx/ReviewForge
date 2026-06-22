import { GoogleGenAI } from '@google/genai';
import * as core from '@actions/core';
import { withRetry } from '../utils/retry.js';
import { buildSystemPrompt } from '../prompts/review-prompt.js';


const MODEL = 'gemini-2.5-flash';

/**
 * Creates the Gemini client.
 *
 * @param {string} apiKey
 * @returns {GoogleGenAI}
 */
export function createGeminiClient(apiKey) {
  if (!apiKey) {
    throw new Error('Gemini API key is required');
  }
  return new GoogleGenAI({ apiKey });
}

/**
 * Sends a code chunk to Gemini for review and returns structured findings.
 */
export async function reviewChunk(client, filename, formattedDiff) {
  const systemPrompt = buildSystemPrompt();

  const userPrompt = `Review the following code diff from file: ${filename}

${formattedDiff}

Respond with ONLY this JSON structure:
{
  "findings": [
    {
      "line": <line number as integer>,
      "severity": "<critical|warning|suggestion|nitpick>",
      "issue": "<short title>",
      "explanation": "<why this is a problem>",
      "suggestion": "<concrete fix>"
    }
  ]
}

If you find no issues, respond with: { "findings": [] }`;

  const response = await withRetry(() =>
    client.models.generateContent({
      model: MODEL,
      contents: userPrompt,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.1,          // low temperature = deterministic output
        maxOutputTokens: 2048,
        responseMimeType: 'application/json',
        responseSchema: {
          type: 'object',
          properties: {
            findings: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  line: { type: 'integer' },
                  severity: { type: 'string' },
                  issue: { type: 'string' },
                  explanation: { type: 'string' },
                  suggestion: { type: 'string' },
                },
                required: ['line', 'severity', 'issue', 'explanation', 'suggestion'],
              },
            },
          },
          required: ['findings'],
        },
      },
    })
  );

  const raw = response.text || '{"findings":[]}';
  // gemini occasionally return percent encoded whitespaces so i  changed  instead of real newline/space char with %0A and %20, so we need to sanitize it before parsing
  
  const sanitized = raw.replace(/%0A/g,'\n').replace(/%20/g,' ');
  try {
    const parsed = JSON.parse(sanitized);
    const findings = parsed.findings || [];

    core.info(`  → ${findings.length} finding(s) from AI`);
    return findings;
  } catch {
    core.warning(`Failed to parse AI response as 
    JSON. Raw: ${sanitized.slice(0, 200)}`);
    
    return [];
  }
}