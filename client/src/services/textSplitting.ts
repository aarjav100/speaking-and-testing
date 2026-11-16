/**
 * Service for cleaning and splitting user-provided book text (Mode A - "My Copy")
 * into speaking chunks of 30 to 50 words along sentence boundaries.
 */

export interface SplitResult {
  paragraphs: string[];
  totalSentences: number;
  totalWords: number;
  cleanedText: string;
}

/**
 * Clean raw text from PDF/TXT/EPUB extracts:
 * - Removes page numbers (e.g., "Page 14", "14 of 250", isolated page numbers)
 * - Removes footnotes (e.g., [1], [2], (1))
 * - Unwraps hyphenated line breaks (e.g., "com- /n munication" -> "communication")
 * - Normalizes whitespace and line breaks
 */
export function cleanRawBookText(rawText: string): string {
  if (!rawText) return '';

  let cleaned = rawText;

  // 1. Rejoin hyphenated words split across lines: e.g. "con-\nversation" -> "conversation"
  cleaned = cleaned.replace(/(\w+)-\r?\n\s*(\w+)/g, '$1$2');

  // 2. Remove standard page indicators:
  // e.g. "Page 123", "Page 123 of 450", "- 45 -", standalone numbers on their own line
  cleaned = cleaned.replace(/^\s*(page\s+\d+(\s+of\s+\d+)?|\d+|-+\s*\d+\s*-+)\s*$/gim, '');

  // 3. Remove numeric footnotes like [1], [24], (1)
  cleaned = cleaned.replace(/\[\d+\]|\(\d+\)/g, '');

  // 4. Remove common running headers/footers containing "chapter", "all rights reserved", etc.
  cleaned = cleaned.replace(/^\s*(chapter\s+\w+|all rights reserved|table of contents)\s*$/gim, '');

  // 5. Replace multiple newlines with single spaces, preserving paragraph breaks if desired
  cleaned = cleaned.replace(/\r?\n+/g, ' ');

  // 6. Normalize multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

/**
 * Split text into individual sentences without breaking abbreviations like "e.g.", "i.e.", "Dr.", "Mr."
 */
export function extractSentences(text: string): string[] {
  if (!text) return [];

  // Protect common abbreviations before splitting
  const protectedText = text
    .replace(/(\b(?:Mr|Mrs|Ms|Dr|Prof|Sr|Jr|vs|etc|e\.g|i\.e)\.)\s+/gi, '$1__SPACE__')
    .replace(/(\b[A-Z]\.)\s+/g, '$1__SPACE__'); // Initials like J. K.

  // Regex splitting at sentence terminators (. ! ?) followed by whitespace or quotes
  const rawSentences = protectedText.match(/[^.!?]+[.!?]+(?:["'”’]?\s+|$)|[^.!?]+$/g) || [];

  return rawSentences
    .map((s) => s.replace(/__SPACE__/g, ' ').trim())
    .filter((s) => s.length > 0);
}

/**
 * Chunks sentences into speaking paragraphs of 30 to 50 words each.
 * CRITICAL RULE: NEVER cuts a sentence in half!
 */
export function chunkIntoSpeakingParagraphs(
  rawText: string,
  minWords = 30,
  maxWords = 52
): SplitResult {
  const cleaned = cleanRawBookText(rawText);
  const sentences = extractSentences(cleaned);

  if (sentences.length === 0) {
    return {
      paragraphs: [],
      totalSentences: 0,
      totalWords: 0,
      cleanedText: '',
    };
  }

  const paragraphs: string[] = [];
  let currentChunk: string[] = [];
  let currentChunkWordCount = 0;
  let totalWordCounter = 0;

  for (let i = 0; i < sentences.length; i++) {
    const sentence = sentences[i];
    const sentenceWords = sentence.split(/\s+/).filter(Boolean).length;
    totalWordCounter += sentenceWords;

    // If adding this sentence keeps chunk <= maxWords, add it
    if (currentChunkWordCount + sentenceWords <= maxWords) {
      currentChunk.push(sentence);
      currentChunkWordCount += sentenceWords;
    } else {
      // If current chunk has reached at least minWords, finalize it
      if (currentChunkWordCount >= minWords) {
        paragraphs.push(currentChunk.join(' '));
        currentChunk = [sentence];
        currentChunkWordCount = sentenceWords;
      } else {
        // If current chunk is still below minWords, include this sentence (even if slightly above maxWords)
        // to strictly avoid cutting sentences or leaving tiny fragments
        currentChunk.push(sentence);
        currentChunkWordCount += sentenceWords;
        paragraphs.push(currentChunk.join(' '));
        currentChunk = [];
        currentChunkWordCount = 0;
      }
    }
  }

  // Final remaining chunk
  if (currentChunk.length > 0) {
    // If the remaining chunk is too small (< 20 words) and we already have paragraphs,
    // merge it with the last paragraph to keep chunks balanced
    if (currentChunkWordCount < 20 && paragraphs.length > 0) {
      paragraphs[paragraphs.length - 1] += ' ' + currentChunk.join(' ');
    } else {
      paragraphs.push(currentChunk.join(' '));
    }
  }

  return {
    paragraphs,
    totalSentences: sentences.length,
    totalWords: totalWordCounter,
    cleanedText: cleaned,
  };
}

/**
 * Extracts plain text from an uploaded file (.txt, .md, .json)
 */
export async function readTextFromFile(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      resolve(text || '');
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file. Please ensure it is a valid text document.'));
    };
    reader.readAsText(file);
  });
}
