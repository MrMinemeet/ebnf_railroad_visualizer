/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

/*
 *     ooOOOO
 *    oo      _____
 *   _I__n_n__||_|| ________
 * >(_________|_7_|-|______|
 *  /o ()() ()() o   oo  oo
 * 
 * This file contains the main logic for the EBNF Railroad Visualizer.
 */

import { Diagram } from "./Diagram.js";
import { Grammar } from "./Grammar.js";
import { compressAndEncode, decodeAndDecompress } from "./Compressor.js";
import type * as d3T from "d3";


const GENERATION_TIMEOUT: number = 100;
const COMPRESSION_THRESHOLD: number = 100;
const PNG_EXPORT_SCALE_FACTOR: number = 4;

// parameter names for URL data
const COMPRESSED_GRAMMAR_PARAM_LZ: string = "grammarlz";
const COMPRESSED_GRAMMAR_PARAM_GZIP: string = "grammargzip";
const GRAMMAR_PARAM: string = "grammar";
const COMPRESSED_EXPAND_PARAM_LZ: string = "expandlz";
const COMPRESSED_EXPAND_PARAM_GZIP: string = "expandlz";
const EXPAND_PARAM: string = "expand";
const START_SYMBOL_PARAM: string = "start";

let d3: (typeof d3T) | undefined;

interface ChooChooVariables {
	toExtend: Set<number[]>; // Set of paths to expand
	currentStartSymbolName: string; // Name of the current start symbol
}

interface LZString {
	decompressFromBase64: (input: string) => string;
}

interface Window extends globalThis.Window{
	chooChoo: ChooChooVariables;

	generateDiagram: () => void;
	handleGenerateDiagram: () => void;
	handleStartSymbolSelection: () => void;
	onCollapseAll: () => void;
	onExpandAll: () => void;
	updateSvgViewBoxSize: () => void;
	exportSvg: () => void;
	exportPng: () => void;

	LZString?: LZString;
}
declare const window: Window & typeof globalThis;

let errorMessageContainer: HTMLElement;
let diagramContainer: HTMLElement;
let ebnfGrammarArea: HTMLTextAreaElement;
let startSymbolDropDown: HTMLElement | undefined;
let startSymbolSelect: HTMLSelectElement;
let zoom: d3.ZoomBehavior<Element, unknown>;
let focusElementPath: string = "";
let timeoutId: unknown;

let chooChoo: ChooChooVariables;

/**
 * Installs provided functions into `window`, initializes global variables and adds listeners.
 * 
 * Provided functions:
 * - `generateDiagram` - Generate the diagram from the entered grammar.
 * - `handleGenerateDiagram` - Handle the generation of a diagram from the entered grammar.
 * - `handleStartSymbolSelection` - Handle the selection of a new start symbol.
 * - `onCollapseAll` - Handle the collapse of all non-terminal-symbols.
 * - `onExpandAll` - Handle the expansion of all non-terminal-symbols.
 * - `exportSvg ` - Export the diagram as an SVG file.
 * - `exportPng` - Export the diagram as a PNG file.
 * 
 * Provided global variables:
 * - `chooChoo` - Holds all necessary objects for this package.
 * 
 * Expected DOM elements:
 * - `error_message` - Container for error messages.
 * - `visualized-ebnf` - Container for the diagram.
 * - `ebnf_grammar` - Textarea for the EBNF grammar.
 * - `.start-symbol-drop-down` - Container for the start symbol dropdown.
 * - `start-symbol` - Select for the start symbol.
 * @param {Window} window The window object to install the functions into.
 * @param {typeof d3} d3Param The d3 to use. Must be imported in the main script and passed here.
 */
export function install(window: Window, d3Param?: typeof d3T): void {
	let elem = document.getElementById("error_message");

	if (elem == null) throw new Error("Failed to find 'error_message' container");
	else errorMessageContainer = elem;
	elem = document.getElementById("visualized-ebnf");

	if (elem == null) throw new Error("Failed to find 'visualized-ebnf' container");
	else diagramContainer = elem;
	elem = document.querySelector("textarea[name=ebnf_grammar]");

	if (elem == null) throw new Error("Failed to find 'ebnf_grammar' textarea");
	else ebnfGrammarArea = elem as HTMLTextAreaElement;
	elem = document.querySelector("#start-symbol");

	if (elem == null) throw new Error("Failed to find 'start-symbol' select");
	else startSymbolSelect = elem as HTMLSelectElement;
	startSymbolDropDown = document.querySelector(".start-symbol-drop-down") as HTMLElement;

	if (d3Param == null) {
		console.warn("d3 not provided. Will not be able to zoom.");
	}
	d3 = d3Param;

	// Initialize provided functions
	window.generateDiagram = generateDiagram;
	window.handleGenerateDiagram = handleGenerateDiagram;
	window.handleStartSymbolSelection = handleStartSymbolSelection;
	window.onCollapseAll = onCollapseAll;
	window.onExpandAll = onExpandAll;
	window.exportSvg = (): Promise<void> => exportSvg();
	window.exportPng = (): Promise<void> => exportPng();

	// Add listeners
	window.addEventListener("resize", window.updateSvgViewBoxSize);

	// Initialize global variables and attach a container to the window for external access
	window.chooChoo = chooChoo = {
		toExtend: new Set<number[]>(),
		currentStartSymbolName: ""
	}
}

/**
 * Focus the element with the path stored in `focusElementPath`.
 */
function focusElementSvg(): void {
	if (d3 == null) {
		return;
	}

	if (focusElementPath.trim().length === 0) {
		return;
	}
	const svg = d3.select(".railroad-diagram");

	// Select "title" element with the path as inner text
	let parent = Array.from((svg.node() as Element)?.querySelectorAll(`title`))
		.filter((title) => title.innerHTML === focusElementPath)[0].parentNode as SVGGElement;

	if (parent == null) throw new Error("Failed to find parent of focus element");

	// If parent is a comment, get the parent of the parent
	if (parent.tagName === "g" && parent.classList.contains("comment")) {
		parent = parent.parentNode as SVGGElement;
	}
	const bbox = parent.getBBox();

	// Center of bbox
	const bboxCenterX = bbox.x + bbox.width / 2;
	const bboxCenterY = bbox.y + bbox.height / 2;

	// Calculate new transform based on bbox center and current svg size
	const viewBox = (svg.node() as any).viewBox.baseVal as DOMRect;
	const newTransform = d3.zoomIdentity.translate(
		viewBox.width / 2 - bboxCenterX,
		viewBox.height / 2 - bboxCenterY
	);

	console.debug(`Box center: (${bboxCenterX}, ${bboxCenterY})`);
	console.debug(`New transform: ${newTransform}`);

	// Apply transform
	svg.call(zoom.transform as any, newTransform);

	// Reset focus element
	focusElementPath = "";
}

/**
 * Handle the generation of a diagram from the entered grammar.
 */
function handleGenerateDiagram(): void {
	generateDiagram();
	updateUrl();
	resetPathCleanupTimer();
}

/**
 * Handle the collapse of all non-terminal-symbols.
 */
function onCollapseAll(): void {
	// Remove all non-terminals to extend
	chooChoo.toExtend.clear();
	// Generate the diagram again
	generateDiagram();
	updateUrl();
}

/**
 * Handle the expansion of all non-terminal-symbols.
 */
function onExpandAll(): void {
	const ebnfGrammarValue = ebnfGrammarArea.value;
	if (ebnfGrammarValue.trim() === "") return;
	console.debug("Expanding all non-erminals");
	// Replace current "chooChoo.toExtend" with all IDs that are expandable
	asyncString2Diagram(ebnfGrammarValue, chooChoo.currentStartSymbolName).then((diagram) => {
	  chooChoo.toExtend = diagram.getAllNtsPaths();
	  generateDiagram();
	  updateUrl();
	}).catch((e) =>  console.warn(e));
	// Generate the diagram again
}

/**
 * Inject D3 zoom into the SVG.
 * Loosely based on https://stackoverflow.com/a/27993650/8527195
 */
function injectD3(): void {
	if (d3 == null) {
		return;
	}

	const diagramSvg = document.getElementsByClassName("railroad-diagram")[0];
	diagramSvg.removeAttribute("width");
	diagramSvg.removeAttribute("height");
	updateSvgViewBoxSize();

	// Get the SVG element that D3-zoom should be applied to
	const svg = d3.select(".railroad-diagram");
	// Get current childs of svg
	const children = Array.from((svg.node() as Element)?.children);
	// Add g node to the SVG
	const g = svg.append("g");
	// Move all children to the g node
	children.forEach((child) => {
		g.node()?.appendChild(child);
	});

	zoom = d3.zoom()
		.scaleExtent([0.1, 8])
		.on("zoom", zoomed);
	svg.call(zoom as any);

	function zoomed({transform}: { transform: d3.ZoomTransform }): void {
		g.attr("transform", transform.toString());
	}
}

/**
 * Generate the diagram from the entered grammar.
 */
function generateDiagram(): void {
	if (ebnfGrammarArea.value.trim() === "") {
		console.debug("Nothing was entered into the textarea.");
		diagramContainer.style.display = "none";
		return;
	}

	const grammarVal = ebnfGrammarArea.value;
	const nonAscii = getNonAsciiChars(grammarVal);
	if (nonAscii.size > 0) {
		console.warn("The following non-ASCII characters were detected in the grammar: ", nonAscii);
		errorMessageContainer.innerHTML = `<p>Non-ASCII character(s) detected: ${Array.from(nonAscii).join(", ")}</p>`;
		errorMessageContainer.style.display = "block";
		diagramContainer.style.display = "none";
		return;
	}

	asyncString2Grammar(grammarVal).then((grammar) => {
		// Get all nts start symbols
		chooChoo.currentStartSymbolName = setStartSymbols(grammar.getStartSymbols(), chooChoo.currentStartSymbolName) || "";
		return asyncGrammar2Diagram(grammar, chooChoo.currentStartSymbolName);
	}).then((diagram) => {
		diagramContainer.innerHTML = diagram.toSvg(chooChoo.toExtend);
		injectD3();

		// Inject listeners for collapsing and expanding
		document.querySelectorAll(".non-terminal")
			.forEach(event => injectCollapseListener(event as HTMLElement));
		document.querySelectorAll("g.comment")
			.forEach(element => injectExpandListener(element as HTMLElement));

		// Set the focus to the element
		focusElementSvg();

		// Hide the error message container
		errorMessageContainer.style.display = "none";
	}).catch(e => {
		const PRODUCTION_NOT_FOUND_REGEX = /^Production '([^']*)' not found, but required for expansion$/;

		console.warn(`An error occurred while generating the diagram: ${e}`);
		if (!e.message.includes("but found") &&
			!e.message.includes("Unknown character") &&
			!PRODUCTION_NOT_FOUND_REGEX.test(e.message)
		) {
			console.warn(e.stack);
		}

		errorMessageContainer.innerHTML = `<p>${e}</p>`;
		errorMessageContainer.style.display = "block";

		// Don't hide graph if it is a "production X not found" error
		if (!PRODUCTION_NOT_FOUND_REGEX.test(e.message)) {
			//diagramContainer.style.display = "none";
			diagramContainer.innerHTML = "";
		}
	});
}

/**
 * Inject a listener for collapsing expanded non-terminal-symbols.
 * @param {HTMLElement} element The element to inject the listener into.
 */
function injectCollapseListener(element: HTMLElement): void {
	element.addEventListener("click", (event) => {
		if (event.currentTarget == null) {
			console.warn("Failed to find current target.");
			return;
		}

		if (event.ctrlKey) {
			// Use the pressed NTS as the start symbol
			const ntsName = (event.currentTarget as HTMLElement).querySelector("text")?.textContent ?? "";
			if (startSymbolSelect == null) {
				console.warn("Failed to find start symbol select.");
				return;
			}
			startSymbolSelect.value = ntsName;
			handleStartSymbolSelection();
		} else {
			// Get ID from iner child with tag "title"
			const title = (event.currentTarget as HTMLElement).querySelector("title");
			const pathTitle = title?.textContent?.trim() ?? "";

			// Expand the NTS
			const path = title2Path(pathTitle);
			if (path.length >= Diagram.MAX_EXPANSION_DEPTH) {
				console.warn(`Cannot expand NTS on path '${pathTitle}'. Depth limit reached!`);
				alert("Max. expansion depth reached!");
				return;
			}

			// Add the ID to the set of non-terminals to extend
			chooChoo.toExtend.add(path);
			console.debug(`Expanding NTS on path '${pathTitle}'`);

			// Get "title" child of the clicked element and set the path as the focus element
			focusElementPath = (event.currentTarget as HTMLElement).querySelector("title")?.innerHTML ?? "";

			// Generate the diagram again
			generateDiagram();
			updateUrl();
		}
	});
}

/**
 * Inject a listener for expanding collapsed non-terminal-symbols.
 * @param {HTMLElement} element The element to inject the listener into.
 */
function injectExpandListener(element: HTMLElement): void {
	element.addEventListener("click", (event) => {
		// Get ID from inner child with tag "title"
		const title = (event.currentTarget as HTMLElement).querySelector("title");
		const pathTitle = title?.textContent?.trim() ?? "";

		// Add the ID to the set of non-terminals to extend
		console.debug(`Collapsing NTS on path '${pathTitle}'`);

		// Remove the pathTitle
		chooChoo.toExtend = new Set(Array.from(chooChoo.toExtend).filter((x) => x.join("-") !== pathTitle));

		// Get "title" child of the clicked element and set the path as the focus element
		focusElementPath = (event.currentTarget as HTMLElement).querySelector("title")?.innerHTML ?? "";

		// Generate the diagram again
		generateDiagram();
		updateUrl();
	});
}

/**
 * Reset the path cleanup timer.
 */
function resetPathCleanupTimer(): void {
	clearTimeout(timeoutId as number);
	timeoutId = setTimeout(() => {
		try {
			const prevSize = chooChoo.toExtend.size;
			chooChoo.toExtend = filterInvalidPaths(ebnfGrammarArea.value, chooChoo.toExtend);
			if (prevSize !== chooChoo.toExtend.size) {
				console.debug(`Cleaned up ${prevSize - chooChoo.toExtend.size} paths`);
				generateDiagram();
				updateUrl();
			} else {
				console.debug("No paths to clean up");
			}
		} catch (e) {
			console.warn(`An error occurred while cleaning up paths (this can likely be ignored): ${e}`);
		}
	}, 5000);
}

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
* Asynchronously generate a diagram from a given grammar string.
* @param {string} grammar - The grammar to generate a diagram from.
* @param {string} startSymbolName - The name of the start symbol. If not provided the first production is used.
* @returns {Promise<Diagram>} - The generated diagram.
* @throws {Error} - If the diagram could not be generated or took longer than the timeout.
*/
async function asyncString2Diagram(grammar: string, startSymbolName?: string): Promise<Diagram> {
	console.debug("Generating diagram…");
	return new Promise((resolve, reject) => {
		// Timeout to prevent blocking the UI or freezing the browser
		asyncString2Grammar(grammar).then((grammar: Grammar) => {
			resolve(asyncGrammar2Diagram(grammar, startSymbolName));
		}).catch(reject);
	});
}

/**
 * Asynchronously generate a diagram from a given grammar.
 * @param {Grammar} grammar - The grammar to generate a diagram from.
 * @param {string} startSymbolName - The name of the start symbol. If not provided the first production is used.
 * @param {string} startSymbolName - The name of the start symbol. If not provided the first production is used.
 * @returns {Promise<Diagram>} - The generated diagram.
 */
async function asyncGrammar2Diagram(grammar: Grammar, startSymbolName?: string): Promise<Diagram> {
	console.debug("Generating diagram…");
	return new Promise((resolve, reject) => {
		// Timeout to prevent blocking the UI or freezing the browser
		const timeoutID = setTimeout(() => {
			console.debug("Generation Timeout");
			reject();
		}, GENERATION_TIMEOUT);

		try {
			// Generate the diagram
			const diagram = Diagram.fromGrammar(grammar, startSymbolName);
			console.debug("Diagram generated successfully.");
			clearTimeout(timeoutID);
			resolve(diagram);
		} catch (e) {
			clearTimeout(timeoutID);
			reject(e);
		}
	});
}

/**
 * Asynchronously generate a grammar from a given grammar string
 * @param {string} grammar - The grammar string to generate from
 * @returns {Promise<Grammar>} - The generated grammar
 */
async function asyncString2Grammar(grammar: string): Promise<Grammar> {
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
 * @param {CSSStyleSheet} styleSheet The CSSStyleSheet to convert.
 * @returns {Promise<string>} A promise that resolves to the CSSStyleSheet as a string.
 */
async function asyncCss2String(styleSheet: CSSStyleSheet): Promise<string> {
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
 * @param {string} base64 The base64 encoded string to convert
 * @returns {string} The base64URL encoded string
 */
function base64ToBase64Url(base64: string): string {
	return base64
		.replace(/\+/g, '-')
		.replace(/\//g, '_')
		.replace(/=/g, '');
}

/**
 * Convert a base64URL encoded string to a base64 encoded string.
 * @param {string} base64Url The base64URL encoded string to convert
 * @returns {string} The base64 encoded string
 */
function base64UrlToBase64(base64Url: string): string {
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
 * @param {string} str The string to check
 * @param {boolean} extended If `true`, the string can contain extended ASCII characters (0-255), otherwise only 0-127
 * @returns {Set<string> A set of non-ASCII characters}
 */
function getNonAsciiChars(str: string, extended: boolean = false): Set<string>  {
	return new Set(str
		.split('')
		.filter(char => char.charCodeAt(0) > (extended ? 255 : 127)));
}

/**
 * Converts the string used for the path in svg titels into an array of numbers representing the path.
 * @param {string} title The title string to convert
 * @returns {number[]} The path as an array of numbers
 */
function title2Path(title: string): number[] {
	return title.split('-').map(Number);
}

/**
 * Add the values of the grammar and expand paths to a URL.
 * The values are added as base64URL encoded strings. If the values are over a certain threshold, they are compressed using LZString. If they are below the threshold, they are only encoded in order to avoid the overhead of compression.
 * If a value is empty, it is removed from the URL. If a value is not provided, it will not be added/removed, nor will it be updated.
 * @param {string} urlHref The URL to add the values to
 * @param {string} grammar The grammar
 * @param {Set<number[]>} expandPath The expand paths
 * @param {string} startSymbolName The name of the start symbol
 * @returns {URL} The URL with the values added
 */
async function addValuesToUrl(urlHref: string, grammar?: string, expandPath?: Set<number[]>, startSymbolName?: string): Promise<URL> {
	const newUrl = new URL(urlHref);

	if (startSymbolName && startSymbolName.trim() !== "") {
		newUrl.searchParams.delete(START_SYMBOL_PARAM);
		if (startSymbolName.trim() !== "") {
			newUrl.searchParams.set(START_SYMBOL_PARAM, startSymbolName);
		}
	}

	if (grammar) {
		newUrl.searchParams.delete(COMPRESSED_GRAMMAR_PARAM_LZ);
		newUrl.searchParams.delete(COMPRESSED_GRAMMAR_PARAM_GZIP);
		newUrl.searchParams.delete(GRAMMAR_PARAM);

		if (grammar.trim() !== "") {
			if (grammar.length > COMPRESSION_THRESHOLD) {
				// Compress the grammar
				const compressedGrammar = await compressAndEncode(grammar);
				newUrl.searchParams.set(COMPRESSED_GRAMMAR_PARAM_GZIP, base64ToBase64Url(compressedGrammar));
			} else {
				// Set the grammar
				const base64Grammar = btoa(grammar);
				newUrl.searchParams.set(GRAMMAR_PARAM, base64ToBase64Url(base64Grammar));
			}
		}
	}

	if (expandPath) {
		newUrl.searchParams.delete(COMPRESSED_EXPAND_PARAM_LZ);
		newUrl.searchParams.delete(COMPRESSED_EXPAND_PARAM_GZIP);
		newUrl.searchParams.delete(EXPAND_PARAM);

		if (expandPath.size !== 0) {
			const joinedPath = Array.from(expandPath).map(path => path.join("-")).join("|");
			if (joinedPath.length > COMPRESSION_THRESHOLD) {
				// Compress the expand paths
				const compressedExpand = await compressAndEncode(joinedPath);
				debugger;
				newUrl.searchParams.set(COMPRESSED_EXPAND_PARAM_GZIP, base64ToBase64Url(compressedExpand));
			} else {
				// Set the expand paths
				const base64Expand = btoa(joinedPath);
				newUrl.searchParams.set(EXPAND_PARAM, base64ToBase64Url(base64Expand));
			}
		}
	}

	return newUrl;
}

/**
 * Get the values of the grammar and expand paths from a URL.
 * The counterpart to `addValuesToUrl`.
 * @param {string} searchParams The search parameters of the URL
 * @returns The grammar, expanded paths and start symbol name
 */
export async function getValuesFromUrl(searchParams: string): Promise<[string, Set<number[]>, string]> {
	const urlSearchparams = new URLSearchParams(searchParams);
	let expandPaths: Set<number[]> = new Set();
	const startSymbolName = urlSearchparams.get(START_SYMBOL_PARAM) || "";

	// Grammar
	const GzipCompressedGrammar = urlSearchparams.get(COMPRESSED_GRAMMAR_PARAM_GZIP);
	const LzCompressedGrammar = urlSearchparams.get(COMPRESSED_GRAMMAR_PARAM_LZ);
	const base64Grammar = urlSearchparams.get(GRAMMAR_PARAM);

	let grammar: string = "";
	if (GzipCompressedGrammar) {
		console.debug("Fetching grammar from Gzip");
		try {
			grammar = await decodeAndDecompress(base64UrlToBase64(GzipCompressedGrammar));
		} catch (e: any) {
			console.error("Decompression failed!", e);
		}

	} else if (LzCompressedGrammar) {
		console.debug("Falling back to old compression library");
		try {
			await fetchLzString();
			// Compressed grammar
			const uncompressedGrammar = window.LZString?.decompressFromBase64(base64UrlToBase64(LzCompressedGrammar));
			if (uncompressedGrammar == null) {
				throw new Error("Decompression failed!");
			}
			grammar = uncompressedGrammar;
		} catch (e: any) {
			console.error("URL uses old compression library, but the library could not be loaded!", e);
		}
	} else if (base64Grammar) {
		// Uncompressed grammar
		grammar = atob(base64UrlToBase64(base64Grammar));
	}

	// Expand paths
	const GzipCompressedExpand = urlSearchparams.get(COMPRESSED_EXPAND_PARAM_GZIP);
	const LzCompressedExpand = urlSearchparams.get(COMPRESSED_EXPAND_PARAM_LZ);
	const base64Expand = urlSearchparams.get(EXPAND_PARAM);

	let expandPathString: string|undefined = undefined;
	if (GzipCompressedExpand) {
		console.debug("Fetching expanded paths from Gzip")
		try {
			expandPathString = await decodeAndDecompress(base64UrlToBase64(GzipCompressedExpand));
		} catch (e: any) {
			console.error("Decompression failed!", e);
		}

	} else if (LzCompressedExpand) {
		console.warn("Falling back to old compression library");
		// Compressed expand paths
		try {
			if (window.LZString == null) {
				await fetchLzString();
			}
			const uncompressedExpand = window.LZString?.decompressFromBase64(base64UrlToBase64(LzCompressedExpand));
			if (uncompressedExpand == null) {
				throw new Error("Decompression failed");
			}
			expandPathString = uncompressedExpand;
		} catch (e: any) {
			console.error("URL uses old compression library, but the library could not be loaded!", e);
		}
	} else if (base64Expand) {
		// Uncompressed expand paths
		expandPathString = atob(base64UrlToBase64(base64Expand));
	}

	if (expandPathString) {
		expandPaths = new Set(expandPathString.split("|").map(path => path.split("-").map(Number)));
	}

	return [grammar, expandPaths, startSymbolName];
}

/**
 * Filter out invalid paths from a set of paths.
 * @param {string} grammar The grammar to find the paths in
 * @param {Set<number[]>} paths The current paths
 * @returns {Set<number[]>} The current paths with invalid paths removed
 */
function filterInvalidPaths(grammar:string, paths: Set<number[]>): Set<number[]> {
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
 * This does not reuse the diagram shown in the UI, but generates a new one to get a clean SVG.
 * @param {Set<number[]>} toExpand The paths to expand
 * @returns The SVG as a svg+xml string
 */
function getSvg(toExpand: Set<number[]>): Promise<string> {
	return new Promise((resolve, reject) => {
		const ebnfGrammarValue = (document.querySelector("textarea[name=ebnf_grammar]") as HTMLTextAreaElement)?.value;
		if (ebnfGrammarValue.trim() === "") {
			console.debug("Nothing was entered into the textarea.");
			reject ("No grammar to visualize");
		}

		// Generate new diagram to get clean SVG
		asyncString2Diagram(ebnfGrammarValue, chooChoo.currentStartSymbolName).then((diagram) => {
			let svgHtml = diagram.toSvg(toExpand);

			const additionalAttributes = [
				'xmlns="http://www.w3.org/2000/svg"',
				'shape-rendering="geometricPrecision"',
				'text-rendering="geometricPrecision"',
				'image-rendering="optimizeQuality"',
			];

			// Add additional attributes to the SVG
			svgHtml = svgHtml.replace("<svg", `<svg ${additionalAttributes.join(" ")}`);

			//  Get the style of the diagram (./css/railroad.css)
			const styleSheet = document.styleSheets[0];

			asyncCss2String(styleSheet).then((cssString) => {
				// Add the CSS to the SVG as a style element
				svgHtml = svgHtml.replace("</defs>", `<style>${cssString}</style></defs>`);

				resolve(svgHtml);
			}).catch((e) => {
				reject(e);
			});
		});
	});
}

/**
 * Export the diagram as an SVG file.
 * @param {Set<number[]>} toExpand The paths to expand, if not provided the current paths are used
 */
export async function exportSvg(toExpand?: Set<number[]>): Promise<void> {
	toExpand = toExpand || chooChoo.toExtend;

	const exportAsSvgButton = document.querySelector("#export-as-svg") as HTMLButtonElement;
	buttonPressLoad(exportAsSvgButton);
	getSvg(toExpand).then((svgHtml) => {
		// Save SVG HTML as file
		const blob = new Blob([svgHtml], {type: "image/svg+xml"});
		const blobUrl = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = blobUrl;
		a.download = "railroad-diagram.svg";
		a.click();
		URL.revokeObjectURL(blobUrl);
		buttonPressReset(exportAsSvgButton);
	});
}

/**
 * Export the diagram as a PNG file.
 * @param {Set<number[]>} toExpand The paths to expand, if not provided the current paths are used
 */
export async function exportPng(toExpand?: Set<number[]>): Promise<void> {
	toExpand = toExpand || chooChoo.toExtend;

	const exportAsPngButton = document.querySelector("#export-as-png") as HTMLButtonElement;
	buttonPressLoad(exportAsPngButton);

	getSvg(toExpand).then((svgHtml) => {
		// Get width and height of the SVG from svgs width and height attributes
		const origWidth = parseFloat(svgHtml.match(/width="([^"]+)"/)?.[1] || "0");
		const origHeight = parseFloat(svgHtml.match(/height="([^"]+)"/)?.[1] || "0");

		// Scale the SVG but keep the aspect ratio
		const aspectRatio = origWidth / origHeight;
		const scaledWidth = (origWidth > origHeight) ? (origWidth * PNG_EXPORT_SCALE_FACTOR) : (origHeight * PNG_EXPORT_SCALE_FACTOR * aspectRatio);
		const scaledHeight = (origWidth > origHeight) ? (origWidth * PNG_EXPORT_SCALE_FACTOR / aspectRatio) : (origHeight * PNG_EXPORT_SCALE_FACTOR);

		console.debug(`Scaled SVG to ${scaledWidth}x${scaledHeight}px for PNG export.`);

		// Update the SVG width and height
		const scaledSvgHtml = svgHtml
			.replace(`width="${origWidth}"`, `width="${scaledWidth}"`)
			.replace(`height="${origHeight}"`, `height="${scaledHeight}"`);

		// Create blob from SVG and use it to create a data URL
		const blob = new Blob([scaledSvgHtml], {type: "image/svg+xml;charset=utf-8"});
		const blobUrl = URL.createObjectURL(blob);

		// Convert the SVG to a PNG using a canvas
		const img = new Image();
		img.src = blobUrl;
		img.onload = function(): void {
			const canvas = document.createElement("canvas");
			canvas.width = scaledWidth;
			canvas.height = scaledHeight;
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
			URL.revokeObjectURL(pngUrl);
			buttonPressReset(exportAsPngButton);
		};
		img.onerror = function(): void {
			console.error("Error loading SVG image");
			console.log(img.src);
			buttonPressReset(exportAsPngButton);
		};
	}).catch((e) => {
		console.error(e);
	});
}

/**
 * Set a spinner cursor and disable a button.
 * @param {HTMLButtonElement} button The button to disable
 */
function buttonPressLoad(button: HTMLButtonElement): void {
	button.style.cursor = "wait";
	button.disabled = true;
}

/**
 * Reset the cursor and enable a button.
 * @param {HTMLButtonElement} button The button to enable
 */
function buttonPressReset(button: HTMLButtonElement): void {
	button.style.cursor = "default";
	button.disabled = false;
}

/**
 * Update the URL with the current grammar and expand paths.
 * @param {string} [startSymbol] The name of the current start symbol
 */
async function updateUrl(startSymbol?:string): Promise<void> {
	const grammar = document.querySelector("textarea[name=ebnf_grammar]") as HTMLTextAreaElement;
	if (!grammar) return;

	const newUrl = await addValuesToUrl(location.href,
		grammar.value,
		chooChoo.toExtend,
		startSymbol ?? chooChoo.currentStartSymbolName
	)

	// Replace URL
	window.history.replaceState({}, "", newUrl);
}

/**
 * Update the Viewbox size of the SVG.
 */
function updateSvgViewBoxSize(): void {
	const diagSvg = document.getElementsByClassName("railroad-diagram")[0];
	if (!diagSvg) return;

	const flexContainer = document.getElementsByClassName("flex-container")[0].children;
	const totalHeightNonEbnfElems = Array.from(flexContainer).slice(0, flexContainer.length - 1).reduce((acc, elem) => acc + elem.clientHeight, 0);
	const leftoverHeight = window.innerHeight - totalHeightNonEbnfElems;

	// Check if parent element is present
	if (!diagSvg.parentElement) return;

	// FIXME: The height is messed up. Therefore the centering feature is off on the vertical axis.
	diagSvg.setAttribute("viewBox", `0 0 ${diagSvg.parentElement.offsetWidth} ${leftoverHeight}`);
}

/**
 * Update the start symbols in the dropdown.
 * @param  {Array<string>} startSymbols The start symbols to set
 * @param  {string} currentStartSymbolName The name of the current start symbol
 * @returns {string|undefined} - The name of the current start symbol
 */
function setStartSymbols(startSymbols: string[], currentStartSymbolName: string): string | undefined {
	if (!startSymbolDropDown) {
		console.warn("Failed to find start symbol drop down.");
		return undefined;
	}

	if (startSymbols.length === 0) {
		startSymbolDropDown.style.display = "none";
		console.warn("Start symbol selection is of size 0");
		return undefined;
	}
	const firstSymbol = startSymbols[0];
	startSymbols.sort();

	startSymbols = startSymbols.sort();

	const startSymbolSelect = document.querySelector("#start-symbol") as HTMLSelectElement;
	if (!startSymbolSelect) {
		console.warn("Failed to find start symbol select.");
		return undefined;
	}

	// Check if the list is up-to-date (length and item wise)
	if (startSymbolSelect.options.length === startSymbols.length) {
		let allMatch = true;
		for (let i = 0; i < startSymbols.length; i++) {
			if (startSymbolSelect.options[i].value !== startSymbols[i]) {
				allMatch = false;
				break;
			}
		}
		if (allMatch) {
			return currentStartSymbolName;
		}
	}

	console.debug("Updating start symbols in dropdown.");
	startSymbolSelect.innerHTML = "";
	startSymbols.forEach((startSymbol) => {
		const option = document.createElement("option");
		option.value = startSymbol;
		option.text = startSymbol;
		startSymbolSelect.appendChild(option);
	});
	startSymbolDropDown.style.display = "block";

	// Check if current start symbol is in the list
	if (startSymbols.includes(currentStartSymbolName)) {
		// Keep the current start symbol
		startSymbolSelect.value = currentStartSymbolName;
		return currentStartSymbolName;
	} else {
		// Use the first start symbol as fallback
		startSymbolSelect.value = firstSymbol;
		updateUrl(firstSymbol);
		return firstSymbol;
	}
}

/**
 * Handle the selection of a new start symbol.
 */
function handleStartSymbolSelection(): void {
	const startSymbolSelect = document.querySelector("#start-symbol") as HTMLSelectElement;
	if (startSymbolSelect == null) {
		throw new Error("Failed to find start symbol select.");
	}

	const startSymbol = startSymbolSelect.value;
	if (startSymbol === chooChoo.currentStartSymbolName) {
		return;
	}
	console.debug(`Setting start symbol to '${chooChoo.currentStartSymbolName}' and creating new diagram.`);
	chooChoo.currentStartSymbolName = startSymbol;
	// Clear "chooChoo.toExtend" as start symbol changed
	chooChoo.toExtend.clear();
	generateDiagram();
	updateUrl();
}

/**
 * Fetches the lz-string library on demand and puts it into the global scope.
 * Only needed if the URL contains a compressed value with the old library.
 */
function fetchLzString(): Promise<void> {
	console.warn("Loading lz-string dynamically. Consider updating the URL");
	return new Promise((resolve, reject) => {
		const script = document.createElement("script");
		script.src = "https://cdn.jsdelivr.net/gh/pieroxy/lz-string@1.5.0/libs/lz-string.min.js";
		script.onload = () => resolve();
		script.onerror = reject;
		document.head.appendChild(script);
	});
}