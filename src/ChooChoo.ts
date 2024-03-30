/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Diagram } from "./Diagram.js";

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

const DIAGRAM_GENERATION_TIMEOUT = 100;

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
* Asynchronously generate a diagram from a given grammar.
* @param {string} grammar - The grammar to generate a diagram from.
* @returns {Promise<Diagram>} - The generated diagram.
* @throws {Error} - If the diagram could not be generated or took longer than the timeout.
*/
export async function asyncGenerateDiagram(grammar: string): Promise<Diagram> {
	console.debug("Generating diagram…");
	return new Promise((resolve, reject) => {
	   // Timeout to prevent blocking the UI or freezing the browser
	   setTimeout(() => {
		   console.debug("Generation Timeout");
		   reject();
	   }, DIAGRAM_GENERATION_TIMEOUT);

	   try {
		   // Generate the diagram
		   const d = Diagram.fromString(grammar);
		   console.debug("Diagram generated successfully.");
		   resolve(d);
	   } catch (e) {
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
				.join("\n"));
		} catch (e) {
			reject(e);
		}
	});
}