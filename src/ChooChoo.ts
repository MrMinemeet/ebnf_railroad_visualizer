/*
 * Copyright (c) 2024. Alexander Voglsperger
 */
import { Diagram } from "./Diagram.js";
import { Grammar } from "./Grammar.js";

import LZString from "./external/lz-string.js";
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

const GENERATION_TIMEOUT: number = 100;
const COMPRESSION_THRESHOLD: number = 100;

const COMPRESSED_GRAMMAR_PARAM: string = "grammarlz";
const GRAMMAR_PARAM: string = "grammar";
const COMPRESSED_EXPAND_PARAM: string = "expandlz";
const EXPAND_PARAM: string = "expand";

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

/**
 * Converts the string used for the path in svg titels into an array of numbers representing the path.
 * @param title The title string to convert
 * @returns The path as an array of numbers
 */
export function titleToPath(title: string): number[] {
	return title.split('-').map(Number);
}


/**
 * Add the values of the grammar and expand paths to a URL.
 * The values are added as base64URL encoded strings. If the values are over a certain threshold, they are compressed using LZString. If they are below the threshold, they are only encoded in order to avoid the overhead of compression.
 * @param url The URL to add the values to
 * @param grammar The grammar
 * @param expandPath The expand paths
 * @returns The URL with the values added
 */
export function addValuesToUrl(urlHref: string, grammar: string, expandPath: Set<number[]>): URL {
	const newUrl = new URL(urlHref);

	// Drop existing parameters
	newUrl.searchParams.delete(COMPRESSED_GRAMMAR_PARAM);
	newUrl.searchParams.delete(GRAMMAR_PARAM);
	newUrl.searchParams.delete(COMPRESSED_EXPAND_PARAM);
	newUrl.searchParams.delete(EXPAND_PARAM);

	if (grammar.trim() !== "") {
		if (grammar.length > COMPRESSION_THRESHOLD) {
			// Compress the grammar
			const compressedGrammar = LZString.compressToBase64(grammar);
			newUrl.searchParams.set(COMPRESSED_GRAMMAR_PARAM, base64ToBase64Url(compressedGrammar));
		} else {
			// Set the grammar
			const base64Grammar = btoa(grammar);
			newUrl.searchParams.set(GRAMMAR_PARAM, base64ToBase64Url(base64Grammar));
		}
	}

	if (expandPath.size !== 0) {
		const joinedPath = Array.from(expandPath).map(path => path.join("-")).join("|");
		if (joinedPath.length > COMPRESSION_THRESHOLD) {
			// Compress the expand paths
			const compressedExpand = LZString.compressToBase64(joinedPath);
			newUrl.searchParams.set(COMPRESSED_EXPAND_PARAM, base64ToBase64Url(compressedExpand));
		} else {
			// Set the expand paths
			const base64Expand = btoa(joinedPath);
			newUrl.searchParams.set(EXPAND_PARAM, base64ToBase64Url(base64Expand));
		}
	}

	return newUrl;
}

/**
 * Get the values of the grammar and expand paths from a URL.
 * The counterpart to `addValuesToUrl`.
 * @param searchParams The search parameters of the URL
 * @returns The grammar and expand paths
 */
export function getValuesFromUrl(searchParams: string): [string, Set<number[]>] {
	const urlSearchparams = new URLSearchParams(searchParams);
	let grammar: string = "";
	let expandPaths: Set<number[]> = new Set();

	// Grammar
	const compressedGrammar = urlSearchparams.get(COMPRESSED_GRAMMAR_PARAM);
	const base64Grammar = urlSearchparams.get(GRAMMAR_PARAM);
	if (compressedGrammar) {
		// Compressed grammar
		const uncompressedGrammar = LZString.decompressFromBase64(base64UrlToBase64(compressedGrammar));
		if (uncompressedGrammar === null) {
			throw new Error("Decompression failed");
		}
		grammar = uncompressedGrammar;

	} else if (base64Grammar) {
		// Uncompressed grammar
		grammar = atob(base64UrlToBase64(base64Grammar));

	}

	// Expand paths
	const compressedExpand = urlSearchparams.get(COMPRESSED_EXPAND_PARAM);
	const base64Expand = urlSearchparams.get(EXPAND_PARAM);
	let expandPathString: string|undefined = undefined;
	if (compressedExpand) {
		// Compressed expand paths
		const uncompressedExpand = LZString.decompressFromBase64(base64UrlToBase64(compressedExpand));
		if (uncompressedExpand === null) {
			throw new Error("Decompression failed");
		}
		expandPathString = uncompressedExpand;

	} else if (base64Expand) {
		// Uncompressed expand paths
		expandPathString = atob(base64UrlToBase64(base64Expand));

	}

	if (expandPathString) {
		expandPaths = new Set(expandPathString.split("|").map(path => path.split("-").map(Number)));
	}

	return [grammar, expandPaths];
}

/**
 * Filter out invalid paths from a set of paths.
 * @param grammar The grammar to find the paths in
 * @param paths The current paths
 * @returns The current paths with invalid paths removed
 */
export function filterInvalidPaths(grammar:string, paths: Set<number[]>): Set<number[]> {
	const validPaths = new Set<number[]>();
	const allPaths = Array.from(Diagram.fromString(grammar).getAllNtsPaths());

	// Return a "union" of all paths and the provided paths
	for (const path of paths) {
		if (allPaths.some(p => p.every((v, i) => v === path[i]))) {
			validPaths.add(path);
		}
	}

	return validPaths;
}

/**
 * Get the SVG of the diagram.
 * @returns The SVG as a svg+xml string
 */
function getSvg(): Promise<string> {
	return new Promise((resolve, reject) => {
		// Get child of "visualized_ebnf" id
		const svgHtml = document.getElementById("visualized_ebnf")?.children[0];
		if (!svgHtml) {
			reject("No diagram to convert");
			return;
		}

		// Get values from viewBox attribute (_ _ width height) and inject them as width and height attributes
		const viewBox = svgHtml.getAttribute("viewBox")?.split(" ");
		if (!viewBox) {
			reject("No viewBox attribute found");
			return;
		}
		svgHtml.setAttribute("width", viewBox[2]);
		svgHtml.setAttribute("height", viewBox[3]);

		// Add XML declarations to the SVG
		svgHtml.setAttribute("xmlns", "http://www.w3.org/2000/svg");
		svgHtml.setAttribute("shape-rendering", "geometricPrecision");
		svgHtml.setAttribute("text-rendering", "geometricPrecision");
		svgHtml.setAttribute("image-rendering", "optimizeQuality");

		//  Get the style of the diagram (./css/railroad.css)
		const styleSheet = document.styleSheets[0];+

		asyncCssToString(styleSheet).then((cssString) => {
			// Add the CSS to the SVG as a style element
			const styleElement = document.createElement("style");
			styleElement.textContent = cssString;
			svgHtml.prepend(styleElement);

			resolve(svgHtml.outerHTML);
		}).catch((e) => {
			reject(e);
		});
	});
}

/**
 * Export the diagram as an SVG file.
 * @returns {void} - Nothing
 */
export function exportSvg(): void {

	getSvg().then((svgHtml) => {
		// Save SVG HTML as file
		const blob = new Blob([svgHtml], {type: "image/svg+xml"});
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = "railroad-diagram.svg";
		a.click();
		URL.revokeObjectURL(blobUrl);
	});
}

/**
 * Export the diagram as a PNG file.
 */
export function exportPng(): void {
	getSvg().then((svgHtml) => {
		// Create blob from SVG and use it to create a data URL
		const blob = new Blob([svgHtml], {type: "image/svg+xml;charset=utf-8"});
		const blobUrl = URL.createObjectURL(blob);

		// Convert the SVG to a PNG using a canvas
		const img = new Image();
		img.src = blobUrl;
		img.onload = function(): void {
			const canvas = document.createElement("canvas");
			canvas.width = img.width;
			canvas.height = img.height;
			const ctx = canvas.getContext("2d");
			if (!ctx) {
				console.error("Canvas not supported");
				return;
			}
			ctx.drawImage(img, 0, 0);

			// Save the PNG
			const pngUrl = canvas.toDataURL("image/png");
			const a = document.createElement("a");
			a.href = pngUrl;
			a.download = "railroad-diagram.png";
			a.click();
		};
		img.onerror = function(): void {
			console.error("Error loading SVG image");
			console.log(img.src);
		};
	}).catch((e) => {
		console.error(e);
	});
}