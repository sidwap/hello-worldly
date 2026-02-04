/**
 * Text normalization utilities for typing tests
 * These functions ensure consistent text formatting across the application
 */

/**
 * Converts curly quotes to straight quotes
 */
export const convertToStraightQuotes = (str: string): string => {
  return str
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'");
};

/**
 * Fixes Devanagari Nukta characters for proper Hindi typing
 */
export const fixNukta = (str: string): string => {
  return str
    .replace(/\u095C/g, "\u0921\u093C")
    .replace(/\u095D/g, "\u0922\u093C");
};

/**
 * Normalizes text by removing extra spaces and converting multiple paragraphs to single paragraph
 * This prevents typing errors when text contains line breaks and extra whitespace
 */
export const normalizeText = (text: string): string => {
  return text
    .replace(/\r\n/g, ' ') // Replace Windows line breaks
    .replace(/\n/g, ' ') // Replace Unix line breaks
    .replace(/\r/g, ' ') // Replace Mac line breaks
    .replace(/\s+/g, ' ') // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
};

/**
 * Applies all text processing transformations
 * Use this for any text that will be used in typing tests
 */
export const processText = (text: string): string => {
  return normalizeText(fixNukta(convertToStraightQuotes(text)));
};
