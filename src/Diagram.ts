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


		{
			let i = repIdx - 1; // Idx of the factor directly before the repetition
			let j = repExpr.terms[0].factors.length - 1; // Idx of the last factor in the repetition
			for (; (i >= 0) && (j >= 0); i--, j--) {
				const repTerm = repExpr.terms[0].factors[j].value as Term;
				const beforeTerm = term.factors[i].value as Term;

				if (!repTerm.equals(beforeTerm)) {
					break;
				}
			}

			if (j >= 0) {
				/*
				* Check if it can be compressed with a separator item on the backedge.
				* Example:
				* x { "," x} -> x on forward edge and "," on backedge of "One or More"
				* Also possible if multiple separators (i.e. symbols on backedge) are used.
				* E.g. should work for x { "," "," x } as well
				*/
				// Check if the remaining factors in the repetition are TS that may be moved to the backedge to compact it in a advanced way
				const remainingRepFactors = repExpr.terms[0].factors.slice(0, j + 1);

				if (remainingRepFactors.every((f) => f.isTS())) {
					console.debug("Advanced compaction possible. Generating compacted sequence with separator on backedge.");
					const forwardEdge: any[] = []; // Holds the fractors presend in the repetition and before it (stuff that can sit on the forward edge) 
					let facts = repExpr.terms[0].factors.slice(j + 1, repExpr.terms[0].factors.length)
					for (const forwardEdgeFactors of facts) {
						forwardEdge.push(this.forFactor(forwardEdgeFactors));
					}

					const backEdge: any[] = []; // Holds the factors that are in the repetition and can be moved to the backedge
					for (const repFactor of remainingRepFactors.reverse()) {
						backEdge.push(this.forFactor(repFactor));
					}

					if (forwardEdge.length !== 0) {
						const compactedRepetition = rr.OneOrMore(rr.Sequence(...forwardEdge), rr.Sequence(...(backEdge).reverse()));
						const compactedFactors = [];
						for (let i = 0; i < term.factors.length; i++) {
							if (i == repIdx) {
								// insert the compacted repetition
								compactedFactors.push(compactedRepetition);
								continue;
							} else if (repIdx - repExpr.terms[0].factors.length + remainingRepFactors.length <= i && i < repIdx) {
								// Skip data that is already in the repetition but keep stuff before and after
								continue;
							}
		
							compactedFactors.push(this.forFactor(term.factors[i], repExpr.id === term.factors[i].value.id));
						}
						return rr.Sequence(...compactedFactors);
					}
				}
			}

			let basicCompaction = true;
			i = repIdx - 1; // Idx of the factor directly before the repetition
			j = repExpr.terms[0].factors.length - 1; // Idx of the last factor in the repetition
			for (; (i >= 0) && (j >= 0); i--, j--) {
				const repTerm = repExpr.terms[0].factors[j].value as Term;
				const beforeTerm = term.factors[i].value as Term;

				if (!repTerm.equals(beforeTerm)) {
					basicCompaction = false;
					break;
				}
			}
			/*
			 * Run Backwards and check if the repetition can be compacted
			 * Example:
			 * a b C { b C } …
			 * start at directly before the repetition and at the end of the repetition and then compare.
			 * I.e. in this case check 'C' and then 'b'. 'a' is not checked as the repetition is at the beginning.
			 */
			if (basicCompaction) {
				// Can basic compaction compacted. Generate sequence with "OneOrMore" flag. This requires "ignoring" the terms before the repetition, that are already in the repetition
				console.debug("Simple compaction possible. Generating compacted sequence with OneOrMore loop.");
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

			// No compacting possible
		}

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
					/* Repetition could not be compacted by using "OneOrMore" loop. 
					 * Check if the loop can be visually compacted by moving symbols to the backedge and using a empty line in the forward edge.
					* Would work for NTS too but looks quite bad and is not as easy to understand. Therefore, it will be limited to TS only.
					*/
					let expr = factor.value as Expression; // A Repetition Factor can only hold a Expression

					// Check if all terms have factors that are terminal symbols
					if (expr.terms.every((t) => t.factors.every((f) => f.isTS()))) {
						// Put all terms in parallel and in there put all factors in reverse sequence
						const parallelTerms: any[] = [];
						
						for (const term of expr.terms) {
							// Reverse the factors to get the correct order in the diagram when shown
							const repFactors = [];
							for (const repFactor of term.factors.slice().reverse()) {
								repFactors.push(this.generateFrom(repFactor));
							}
							parallelTerms.push(rr.Sequence(...repFactors));
						}
						return rr.OneOrMore(rr.Skip(), rr.Choice(Math.floor((parallelTerms.length) / 2), ...parallelTerms));
					}

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
	 * Inject markers into the SVG.
	 * It includes some SVG madness to inject markers into the correct paths. With quite a bunch of magic values that I found out by trial and error.
	 * @param {string} svg The SVG string with injected markers
	 * @returns {string} The SVG string with injected markers
	 */
	private injectMarkers(svg: string): string {
		// Create marker
		const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
		// Outgoing file marker and arrow definitions
		{
			const outgoingMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
			outgoingMarker.setAttribute("id", "outgoing-loop-arrow");
			outgoingMarker.setAttribute("viewBox", "0 0 10 10");
			outgoingMarker.setAttribute("markerWidth", "10");
			outgoingMarker.setAttribute("markerHeight", "10");
			outgoingMarker.setAttribute("markerUnits", "strokeWidth");
			outgoingMarker.setAttribute("refX", "10.7");
			outgoingMarker.setAttribute("refY", "3.2");
			const outgoingMarkerElem = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			outgoingMarkerElem.setAttribute("class", "outgoing-arrow");
			outgoingMarkerElem.setAttribute("points", "2.5,5 8,2.5 8,7.5");
			outgoingMarkerElem.setAttribute("style", "fill:black;stroke:black;stroke-width:2");
			outgoingMarkerElem.setAttribute("transform", "rotate(130, 5, 5), scale(0.5)");
			outgoingMarker.appendChild(outgoingMarkerElem);
			defs.appendChild(outgoingMarker);
		}

		// Incoming file marker and arrow definitions
		{
			const incomingMarker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
			incomingMarker.setAttribute("id", "incoming-loop-arrow");
			incomingMarker.setAttribute("viewBox", "0 0 10 10");
			incomingMarker.setAttribute("markerWidth", "10");
			incomingMarker.setAttribute("markerHeight", "10");
			incomingMarker.setAttribute("markerUnits", "strokeWidth");
			incomingMarker.setAttribute("refX", "0.4");
			incomingMarker.setAttribute("refY", "4.75");
			const incomingMarkerElem = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
			incomingMarkerElem.setAttribute("class", "incoming-arrow");
			incomingMarkerElem.setAttribute("points", "2.5,5 8,2.5 8,7.5");
			incomingMarkerElem.setAttribute("style", "fill:black;stroke:black;stroke-width:2");
			incomingMarkerElem.setAttribute("transform", "rotate(-30, 5, 5), scale(0.5)");
			incomingMarker.appendChild(incomingMarkerElem);
			defs.appendChild(incomingMarker);
		}

		// Inject marker definition
		const svgWithMarkerDef = svg.replace(">", `>${defs.outerHTML}`);

		// Inject markers into correct paths
		const OUTGOING_LOOP_CURVE_REGEX = /<path d="M([\d.]+ [\d.]+)a10 10 0 0 0 -10 10v([\d.]+)a10 10 0 0 0 10 10"><\/path>/g;
		const INCOMING_LOOP_CURVE_REGEX = /<path d="M([\d.]+ [\d.]+)a10 10 0 0 0 10 -10v(-?[\d.]+)a10 10 0 0 0 -10 -10"><\/path>/g;
		let injectedMarkerSvg = svgWithMarkerDef
			.replace(OUTGOING_LOOP_CURVE_REGEX,  (_: string, p1: string, p2: string) => {
				return `<path d="M${p1}a10 10 0 0 0 -10 10v${p2}a10 10 0 0 0 10 10" marker-start="url(#outgoing-loop-arrow)"></path>`;
			}).replace(INCOMING_LOOP_CURVE_REGEX, (_: string, p1: string, p2: string) => {
				return `<path d="M${p1}a10 10 0 0 0 10 -10v${p2}a10 10 0 0 0 -10 -10" marker-start="url(#incoming-loop-arrow)"></path>`;
			});
		return injectedMarkerSvg;
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