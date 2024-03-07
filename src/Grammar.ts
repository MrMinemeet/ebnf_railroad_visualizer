/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Syntax } from "./wsn/Syntax";
import { Scanner } from "./scannerparser/Scanner";


/**
 * Represents the parsed grammar.
 */
export class Grammar {
	readonly syntax: Syntax;

	constructor(syntax: Syntax) {
		this.syntax = syntax;
	}

	/**
	 * Creates a new {@link Grammar} instance from a given string containing a grammar.
	 * @param grammar The grammar to parse. The individual productions must be separated by a newline.
	 * @returns 
	 */
	static fromString(grammar: string): Grammar {
		const prodStrings = grammar.trim().split("\n");
		console.log(prodStrings);

		const scanner = new Scanner(grammar);
		while (scanner.hasNext()) {
			console.log(scanner.next());
		}

		const syntax: Syntax = new Syntax([]);
		return new Grammar(syntax);
	}

	toString(): string {
		return this.syntax.toString();
	}
}