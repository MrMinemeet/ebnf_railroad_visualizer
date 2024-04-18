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
	private readonly MAX_EXPANSION_DEPTH: number = 30;

	private readonly grammar: Grammar;
	private readonly pathStack: number[]; // Tracks the current path based on the sym.ids. E.g. [1, 3, 2] references the path from Sym with id 1 to sym with id 2 over sym with id 3
	private expandingNtsPaths: number[][]; // Holds the paths for all NTS that should be expanded

	private constructor(grammar: Grammar) {
		this.grammar = grammar;
		this.pathStack = [];
		this.expandingNtsPaths = [];
	}

	/**
	 * Generate a diagram from a grammar
	 * @param grammarString The grammar as a string
	 * @returns	{Diagram} The diagram
	 */
	static fromString(grammarString: string): Diagram {
		return new Diagram(Grammar.fromString(grammarString));
	}

	/**
	 * Generate a diagram from a production
	 * @returns {any} The diagram
	 */
	private generateDiagram(): any {
		const firstProd = this.grammar.syntax.productions[0];
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
		const factors = [];
		for (const factor of term.factors) {
			factors.push(this.generateFrom(factor));
		}

		const first = factors.shift();
		if (factors.length === 0) {
			return first;
		} else {
			return rr.Sequence(first, ...factors);
		}
	}

	private forFactor(factor: Factor): any {
		const generated = this.generateFrom(factor.value);
		switch (factor.type) {
			case FactorType.Identifier:
			case FactorType.Literal:
				return generated;

			case FactorType.Group:
				return rr.Sequence(generated);

			case FactorType.Repetition:
				return rr.ZeroOrMore(generated);

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

					// Path of the identifier
					const identPath = this.pathStack.join("-");

					// Expand in in expandingNtsPaths or if the depth is reached
					if ((this.pathStack.length < this.MAX_EXPANSION_DEPTH) ||
						this.expandingNtsPaths
							.some(path => path.join("-") === identPath )) {
						// Expand NTS
						const identProduction = this.getProductionFromName(sym.toString());
						val = rr.Group(this.generateFrom(identProduction.expr), sym.name, identPath);
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
	 * Get a production from its name
	 * @param name The name of the production
	 * @returns {Production} The production corresponding to the name
	 * */
	private getProductionFromName(name: string): Production {
		for (const prod of this.grammar.syntax.productions) {
			if (prod.ident.name === name) {
				return prod;
			}
		}
		throw new Error(`Production '${name}' not found`);
	}


	/**
	 * A diagram in SVG format
	 * @param expandingNtsPaths The paths of the NTS that should be expanded
	 * @returns {string} The diagram in SVG format
	 */
	toSvg(expandingNtsPaths: Set<[]> = new Set()): string {
		this.expandingNtsPaths = [...expandingNtsPaths];
		return this.generateDiagram().toString() as string;
	}

	/**
	 * A diagram in string format
	 * @returns {string} The diagram in string format
	 */
	toString(): string {
		return this.generateDiagram().toString();
	}
}