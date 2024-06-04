/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Grammar } from "./Grammar.js";
import { Sym } from "./scannerparser/Sym.js";
import rr from "./external/railroad.js";
import { Literal } from "./wsn/Literal.js";
import { Identifier } from "./wsn/Identifier.js";
import { Production } from "./wsn/Production.js";
import { Expression } from "./wsn/Expression.js";
import { Term } from "./wsn/Term.js";
import { Factor, FactorType } from "./wsn/Factor.js";
import { isUppercase } from "./ChooChoo.js";

export class Diagram {
	// Don't expand NTS deeper than this value.
	// DON'T INCREASE THIS VALUE! IT WILL BREAK THE DIAGRAM GENERATION AND YOUR BROWSER!
	// TODO: This is a workarround for now. The recursive detection is not yet implemented.
	public static readonly MAX_EXPANSION_DEPTH: number = 30;

	readonly grammar: Grammar;
	private readonly pathStack: number[]; // Tracks the current path based on the sym.ids. E.g. [1, 3, 2] references the path from Sym with id 1 to sym with id 2 over sym with id 3
	private expandingNtsPaths: number[][]; // Holds the paths for all NTS that should be expanded
	private collectPaths: boolean;

	private startSymbolName: string; // The name of the start symbol for the creation of the diagram

	private constructor(grammar: Grammar, startSymbolName: string) {
		this.grammar = grammar;
		this.pathStack = [];
		this.expandingNtsPaths = [];
		this.collectPaths = false;
		this.startSymbolName = startSymbolName;
	}

	/**
	 * Generate a diagram from a grammar
	 * @param {string} grammarString The grammar as a string
	 * @param {string?} startSymbolName The name of the start symbol. If not provided the first production is used
	 * @returns	{Diagram} The diagram
	 */
	static fromString(grammarString: string, startSymbolName?: string): Diagram {
		return this.fromGrammar(Grammar.fromString(grammarString), startSymbolName);
	}

	/**
	 * Generate a diagram from a grammar
	 * @param {Grammar} grammar The grammar
	 * @param {string?} startSymbolName The name of the start symbol. If not provided the first production is used
	 * @param startSymbolName The name of the start symbol. If not provided the first production is used
	 * @returns {Diagram} The diagram
	 */
	static fromGrammar(grammar: Grammar, startSymbolName?: string): Diagram {
		return new Diagram(grammar, startSymbolName || "");
	}

	/**
	 * Generate a diagram from a production
	 * @returns {any} The diagram
	 */
	private generateDiagram(): any {
		// Get the use the specified start symbol or the first production as a fallback
		const  firstProd = (this.startSymbolName.length > 0) ? 
			this.grammar.getProductionFromName(this.startSymbolName) : 
			this.grammar.syntax.productions[0];

		const diagram = rr.Diagram(this.generateFrom(firstProd));
		return diagram;
	}

	private forProduction(prod: Production): any {
		const idk = this.generateFrom(prod.expr);
		return rr.Sequence(idk);
	}

	private forExpression(expr: Expression): any {
		const terms = [];
		for (const term of expr.terms) {
			terms.push(this.generateFrom(term));
		}

		const first = terms.shift();
		if (terms.length === 0) {
			return first;
		} else {
			return rr.Choice( Math.floor((terms.length + 1) / 2), first, ...terms);
		}
	}

	private forTerm(term: Term): any {
		if (term.factors.length === 1) {
			// The Term only consists of one factor
			console.debug("Term only has one factor. Generating from single factor without any optimizations/changes.");
			return this.generateFrom(term.factors[0]);
		}
		// Term has multiple factors. search for repetition that can be compacted

		// Search if factors of type repetition
		const repIdx = term.factors.findIndex((f) => f.type === FactorType.Repetition);
		if (repIdx === -1) {
			// No repetition factor found. Generate a sequence
			console.debug("No repetition found. Generating basic sequence.");
			return this.generateBasicSequence(term.factors);
		}

		// Repetition factor found -> Check if it can be compacted
		const repExpr = term.factors[repIdx].value as Expression;

		// Don't support multiple terms in a repetition for compacting
		if (repExpr.terms.length !== 1) {
			console.debug("Repetition has multiple terms (i.e. contains optionals). Can't compact.")
			return this.generateBasicSequence(term.factors);
		}

		//Can't compact if the content of the loop is longer than the stuff before the loop (using index of repetition)
		if (repExpr.terms[0].factors.length > repIdx) {
			console.debug("More factors in repetition than before it. Can't compact.")
			return this.generateBasicSequence(term.factors);
		}

		/*
			Run Backwards and check if the repetition can be compacted
			Example:
			a b C { b C } …
			start at directly before the repetition and at the end of the repetition and then compare.
			I.e. in this case check 'C' and then 'b'. 'a' is not checked as the repetition is at the beginning.
		*/
		{
			let canBeCompacted = true;
			for (let i = repIdx - 1, j = repExpr.terms[0].factors.length - 1; (i >= 0) && (j >= 0); i--, j--) {
				const repTerm = repExpr.terms[0].factors[j].value as Term;
				const beforeTerm = term.factors[i].value as Term;

				if (!repTerm.equals(beforeTerm)) {
					canBeCompacted = false;
					break;
				}
			}
			if (canBeCompacted) {
				// Can be compacted. Generate sequence with "OneOrMore" flag. This requires "ignoring" the terms before the repetition, that are already in the repetition
				console.debug("Can be compacted. Generating compacted sequence.");
				const compactedFactors = [];
				for (let i = 0; i < term.factors.length; i++) {
					// Skip data that is already in the repetition but keep stuff before and after
					if (repIdx - repExpr.terms[0].factors.length <= i && i < repIdx) {
						continue;
					}

					compactedFactors.push(this.forFactor(term.factors[i], repExpr.id === term.factors[i].value.id));
				}
				return rr.Sequence(...compactedFactors);
			}
		}

		/**
		 * Check if it can be compressed with a separator item on the backedge.
		 * Example:
		 * x { "," x} -> x on forward edge and "," on backedge of "One or More"
		 * Also possible if multiple separators (i.e. symbols on backedge) are used.
		 * E.g. should work for x { "," "," x } as well
		 */
		// TODO:

		/* 
		 * Check if the symbols inside the repetition are TS.
		 * Compaction by moving repetition to backedge and using a empty line in the forward edge.
		 * Utilize a "OneOrMore" loop
		 */
		// TODO


		



		console.debug("Can't be compacted or visually prepared. Generating basic sequence.");
		return this.generateBasicSequence(term.factors);	
	}

	private generateBasicSequence(factors: Factor[]): any {
		const generatedFactors: any[] = [];
		for (const factor of factors) {
			generatedFactors.push(this.generateFrom(factor));
		}
		return rr.Sequence(...generatedFactors);
	}

	private forFactor(factor: Factor, oneOrMore: boolean = false): any {
		const generated = this.generateFrom(factor.value);
		switch (factor.type) {
			case FactorType.Identifier:
			case FactorType.Literal:
				return generated;

			case FactorType.Group:
				return rr.Sequence(generated);

			case FactorType.Repetition:
				if (oneOrMore) {
					return rr.OneOrMore(generated);
				} else {
					return rr.ZeroOrMore(generated);
				}

			case FactorType.Optionally:
				return rr.Optional(generated);

			default:
				throw new Error(`Unknown factor type: ${factor.type}`);
		}
	}

	private generateFrom(sym: Sym): any {
		this.pathStack.push(sym.id);

		let val: any;
		switch (true) {
			case sym instanceof Production:
				val = this.forProduction(sym);
				break;

			case sym instanceof Expression:
				val = this.forExpression(sym,);
				break;

			case sym instanceof Term:
				val = this.forTerm(sym);
				break;

			case sym instanceof Factor:
				val =  this.forFactor(sym);
				break;

			case sym instanceof Identifier:
				if (isUppercase(sym.toString())) {
					// Non-terminal Symbol
					if (this.collectPaths) {
						// Collect the path
						this.expandingNtsPaths.push(this.pathStack.slice());
					}

					// Path of the identifier
					const identPath = this.pathStack.join("-");

					// Expand in in expandingNtsPaths or if the depth is reached
					if ((this.pathStack.length < Diagram.MAX_EXPANSION_DEPTH) &&
						this.expandingNtsPaths
							.some(path => path.join("-") === identPath )) {
						// Expand NTS
						try {
							const identProduction = this.grammar.getProductionFromName(sym.toString());
							val = rr.Group(this.generateFrom(identProduction.expr), sym.name, identPath);
						} catch (e) {
							throw new Error(`Production '${sym.toString()}' not found, but required for expansion`);
						}
					} else {
						// No NTS expansion
						val = rr.NonTerminal(sym.toString(), { title: identPath });
					}
				} else {
					// Terminal
					val = rr.Terminal(sym.toString());
				}
				break;

			case sym instanceof Literal:
				val =  rr.Terminal(sym.toString());
				break;
		}

		// Pop the last path when returning
		this.pathStack.pop();
		return val;
	}

	/**
	 * A diagram in SVG format
	 * @param {Set<number[]>} expandingNtsPaths The paths of the NTS that should be expanded
	 * @returns {string} The diagram in SVG format
	 */
	toSvg(expandingNtsPaths: Set<number[]> = new Set()): string {
		this.expandingNtsPaths = [...expandingNtsPaths];
		return this.injectMarkers(this.generateDiagram().toString() as string);
	}

	/**
	 * Inject markers into the SVG
	 * @param {string} svg The SVG string with injected markers
	 * @returns {string} The SVG string with injected markers
	 */
	private injectMarkers(svg: string): string {
		// Create marker
		const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
		marker.setAttribute("id", "loop-arrow");
		marker.setAttribute("viewBox", "0 0 10 10");
		marker.setAttribute("markerWidth", "5");
		marker.setAttribute("markerHeight", "5");
		marker.setAttribute("markerUnits", "strokeWidth");
		marker.setAttribute("refX", "8");
		marker.setAttribute("refY", "5.5");
		marker.setAttribute("orient", "300");
		const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
		path.setAttribute("class", "arrow");
		path.setAttribute("d", "M0,0 L7,3 L0,6 Z"); // Move to 0,0, draw line to 10,5, draw line to 0,10, go back to start
		path.setAttribute("fill", "black");
		marker.appendChild(path);
		defs.appendChild(marker);

		// Inject marker definition
		const svgWithMarkerDef = svg.replace(">", `>${defs.outerHTML}`);

		// Inject markers into correct paths
		const LOOP_CURVE_REGEX = /<path d="M([\d.]+ [\d.]+)a10 10 0 0 0 -10 10v([\d.]+)a10 10 0 0 0 10 10"><\/path>/g;
		const completeMarkerSvg = svgWithMarkerDef.replace(LOOP_CURVE_REGEX,  (_: string, p1: string, p2: string) => {
			return `<path d="M${p1}a10 10 0 0 0 -10 10v${p2}a10 10 0 0 0 10 10" marker-start="url(#loop-arrow)"></path>`;
		});
		return completeMarkerSvg;
	}

	/**
	 * Get all NTS paths that should be expanded.
	 * Still adhears to the MAX_EXPANSION_DEPTH limit.
	 * @returns {Set<number[]>} The paths of the NTS that should be expanded
	 */
	getAllNtsPaths(): Set<number[]> {
		this.collectPaths = true;
		this.generateDiagram();
		this.collectPaths = false;
		return new Set(this.expandingNtsPaths);
	}

	/**
	 * A diagram in string format
	 * @returns {string} The diagram in string format
	 */
	toString(): string {
		return this.generateDiagram().toString();
	}
}