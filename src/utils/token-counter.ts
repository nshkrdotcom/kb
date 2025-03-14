// src/utils/token-counter.ts
import { encode } from 'gpt-tokenizer';

/**
 * Count the number of tokens in a text
 */
export async function countTokens(text: string): Promise<number> {
  try {
    // Use the GPT tokenizer
    const tokens = encode(text);
    return tokens.length;
  } catch (error) {
    // Fallback to a simple approximation
    return Math.ceil(text.length / 4);
  }
}