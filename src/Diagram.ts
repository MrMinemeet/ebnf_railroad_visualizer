/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { Grammar } from "./Grammar.js";
import { Sym } from "./scannerparser/Sym.js";
import rr from "./railroad.js";
import { Literal } from "./wsn/Literal.js";
import { Identifier } from "./wsn/Identifier.js";
import { Production } from "./wsn/Production.js";
import { Expression } from "./wsn/Expression.js";
import { Term } from "./wsn/Term.js";
import { Factor, FactorType } from "./wsn/Factor.js";
import { isUppercase } from "./ChooChoo.js";

export class Diagram {
	private readonly grammar: Grammar;

	private constructor(grammar: Grammar) {
		this.grammar = grammar;
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
	private generateDiagram(toExpandIDs: number[] = []): any {
		const firstProd = this.grammar.syntax.productions[0];
		const diagram = rr.Diagram(this.generateFrom(firstProd, toExpandIDs));
		return diagram;
	}

	private forProduction(prod: Production, toExpandIDs: number[] = []): any {
		const idk = this.generateFrom(prod.expr, toExpandIDs);
		return rr.Sequence(idk);
	}

	private forExpression(expr: Expression, toExpandIDs: number[] = []): any {
		const terms = [];
		for (const term of expr.terms) {
			terms.push(this.generateFrom(term, toExpandIDs));
		}

		const first = terms.shift();
		if (terms.length === 0) {
			return first;
		} else {
			return rr.Choice( (terms.length + 1) / 2, first, ...terms);
		}
	}

	private forTerm(term: Term, toExpandIDs: number[] = []): any {
		const factors = [];
		for (const factor of term.factors) {
			factors.push(this.generateFrom(factor, toExpandIDs));
		}

		const first = factors.shift();
		if (factors.length === 0) {
			return first;
		} else {
			return rr.Sequence(first, ...factors);
		}
	}

	private forFactor(factor: Factor, toExpandIDs: number[] = []): any {
		const generated = this.generateFrom(factor.value, toExpandIDs);
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

	private generateFrom(sym: Sym, toExpandIDs: number[] = []): any {
		let val: any;
		switch (true) {
			case sym instanceof Production:
				val = this.forProduction(sym, toExpandIDs);
				break;

			case sym instanceof Expression:
				val = this.forExpression(sym, toExpandIDs);
				break;

			case sym instanceof Term:
				val = this.forTerm(sym, toExpandIDs);
				break;

			case sym instanceof Factor:
				val =  this.forFactor(sym, toExpandIDs);
				break;

			case sym instanceof Identifier:
				if (isUppercase(sym.toString())) {
					// Non-terminal
					if (toExpandIDs.some(id => id === sym.id)) {
						// Remove ID from list to not expand it again in recursion
						toExpandIDs.splice(toExpandIDs.indexOf(sym.id), 1);

						// Expand NTS
						const innerProd = this.getProductionFromName(sym.toString());
						val = rr.Group(this.generateFrom(innerProd.expr, toExpandIDs), sym.name, sym.id);

						// Re-add ID
						toExpandIDs.push(sym.id);
					} else {
						// No NTS expansion
						val = rr.NonTerminal(sym.toString(), { title: sym.id });
					}
				} else {
					// Terminal
					val = rr.Terminal(sym.toString(), { title: sym.id });
				}
				break;

			case sym instanceof Literal:
				val =  rr.Terminal(sym.toString(), { title: sym.id });
				break;
		}

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
		throw new Error(`Production ${name} not found`);
	}

	/**
	 * A diagram in SVG format
	 * @param toExpandIDs The IDs of the non-terminals to expand
	 * @returns {string} The diagram in SVG format
	 */
	toSvg(toExpandIDs: number[] = []): string {
		return this.generateDiagram(toExpandIDs).toString() as string;
	}

	/**
	 * A diagram in string format
	 * @returns {string} The diagram in string format
	 */
	toString(): string {
		return this.generateDiagram().toString();
	}
}