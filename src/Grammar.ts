/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Syntax } from "./wsn/Syntax.js";
import { Scanner } from "./scannerparser/Scanner.js";
import { Parser } from "./scannerparser/Parser.js";
import { Production } from "./wsn/Production.js";

/**
 * Represents the parsed grammar.
 */
export class Grammar {
	readonly syntax: Syntax;

	private constructor(syntax: Syntax) {
		this.syntax = syntax;
	}

	/**
	 * Creates a new {@link Grammar} instance from a given string containing a grammar.
	 * @param grammar The grammar to parse. The individual productions must be separated by a newline.
	 * @returns
	 */
	static fromString(grammar: string): Grammar {
		const scanner = new Scanner(grammar);
		const parser = new Parser(scanner);
		return new Grammar(parser.parse());
	}

	toString(): string {
		return this.syntax.toString();
	}

	/**
	 * Returns the potential start identifiers of the grammar.
	 * @returns The names of the start symbols.
	 */
	getStartSymbols(): string[] {
		return this.syntax.productions.map(p => p.ident.toString());
	}

	getProductionFromName(name: string): Production {
		const prod = this.syntax.productions.find(p => p.ident.name === name);
		if (prod) {
			return prod;
		}
		throw new Error(`Production '${name}' not found`);
	}
}