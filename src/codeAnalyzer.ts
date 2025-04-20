// src/codeAnalyzer.ts
import { OpenAI } from 'openai';
import { config } from 'dotenv';
import { TutorialResult } from './types';

config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function analyzeCode(code: string): Promise<TutorialResult> {
  const prompt = `Explain the following code as a tutorial for beginners. Include step-by-step reasoning and note the language:

\n\n\`\`\`
${code}
\`\`\``;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
  });

  const response = completion.choices[0].message.content || '';
  return {
    tutorialText: response.trim(),
    language: 'typescript', // optionally detect via code parsing
  };
}