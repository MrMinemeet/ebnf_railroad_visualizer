/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Diagram } from "./Diagram.js";
import { Grammar } from "./Grammar.js";
/*
 *     ooOOOO
 *    oo      _____
 *   _I__n_n__||_|| ________
 * >(_________|_7_|-|______|
 *  /o ()() ()() o   oo  oo
 *
 * This file is my "utils.ts" version, for stuff that I need, doesn't fit somewhere
 * else and/or is not provided my TS/JS per default.
 */

const GENERATION_TIMEOUT = 100;

/**
 * Checks if a word starts with an uppercase letter.
 *
 * Because of course TS/JS doesn't have a built-in function for that.
 * @param word The word to check.
 * @returns `true` if the word starts with an uppercase letter, `false` otherwise.
 */
export function isUppercase(word: string): boolean {
	return /^\p{Lu}/u.test( word );
}

/**
 * Checks if char is some type of quote character.
 *
 * Because iOS (and probably other OS) uses different quotes.
 * @param char The character to check.
 * @returns `true` if the character is a quote character, `false` otherwise.
 */
export function isQuote(char: string): boolean {
	return char === '"' || char === '„' || char ==='“';
}

/**
* Asynchronously generate a diagram from a given grammar.
* @param {string} grammar - The grammar to generate a diagram from.
* @returns {Promise<Diagram>} - The generated diagram.
* @throws {Error} - If the diagram could not be generated or took longer than the timeout.
*/
export async function asyncGenerateDiagram(grammar: string): Promise<Diagram> {
	console.debug("Generating diagram…");
	return new Promise((resolve, reject) => {
	   // Timeout to prevent blocking the UI or freezing the browser
	   	const timeoutID = setTimeout(() => {
			console.debug("Generation Timeout");
			reject();
	   	}, GENERATION_TIMEOUT);

	   	try {
			// Generate the diagram
			const d = Diagram.fromString(grammar);
			console.debug("Diagram generated successfully.");
			clearTimeout(timeoutID);
			resolve(d);
	   	} catch (e) {
			clearTimeout(timeoutID);
			reject(e);
	   	}
	});
}

/**
 * Asynchronously generate a grammar from a given grammar string
 * @param {string} grammar - The grammar string to generate from
 * @returns {Promise<Diagram>} - The generated grammar
 */
export async function asyncGenerateGrammar(grammar: string): Promise<Grammar> {
	console.debug("Scanning/Parsing grammar");
	return new Promise((resolve, reject) => {
		// Timeout to prevent blocking the UI or freezing the browser
		const timeoutID = setTimeout(() => {
			 console.debug("Generation Timeout");
			 reject();
		}, GENERATION_TIMEOUT);

		try {
			 // Generate the diagram
			 const g = Grammar.fromString(grammar);
			 console.debug("Grammar scanned/parsed successfully.");
			 clearTimeout(timeoutID);
			 resolve(g);
		} catch (e) {
			 clearTimeout(timeoutID);
			 reject(e);
		}
	 });
}

/**
 * Asynchronously convert a CSSStyleSheet to a string.
 * @param styleSheet The CSSStyleSheet to convert.
 * @returns A promise that resolves to the CSSStyleSheet as a string.
 */
export async function asyncCssToString(styleSheet: CSSStyleSheet): Promise<string> {
	return new Promise((resolve, reject) => {
		try {
			resolve(Array.from(styleSheet.cssRules)
				.map(rule => rule.cssText)
				// Don't include hover rules (The collapse/expand doesn't work in SVGs anyway)
				.filter(rule => !rule.includes("hover"))
				.join("\n"));
		} catch (e) {
			reject(e);
		}
	});
}

/**
 * Convert a base64 encoded string to a base64URL encoded string.
 * @param base64 The base64 encoded string to convert
 * @returns The base64URL encoded string
 */
export function base64ToBase64Url(base64: string): string {
	return base64
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Convert a base64URL encoded string to a base64 encoded string.
 * @param base64Url The base64URL encoded string to convert
 * @returns The base64 encoded string
 */
export function base64UrlToBase64(base64Url: string): string {
	let base64 = base64Url
		.replace(/-/g, '+')
		.replace(/_/g, '/');
	while (base64.length % 4 !== 0) {
		base64 += '=';
	}
	return base64;
}

/**
 * Check if a string is ASCII.
 * @param str The string to check
 * @param extended If `true`, the string can contain extended ASCII characters (0-255), otherwise only 0-127
 * @returns
 */
export function getNonAsciiChars(str: string, extended: boolean = false): Set<string>  {
	return new Set(str
		.split('')
		.filter(char => char.charCodeAt(0) > (extended ? 255 : 127)));
}