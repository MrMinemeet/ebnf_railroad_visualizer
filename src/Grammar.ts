/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Syntax } from "./wsn/Syntax";
import { Scanner } from "./scannerparser/Scanner";
import { Parser } from "./scannerparser/Parser";


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
		console.log("Scanner:");
		const scanner = new Scanner(grammar);
		while (scanner.hasNext()) {
			console.log(scanner.next());
		}

		console.log("Parser:");
		const parser = new Parser(scanner);
		parser.parse();
		

		const syntax: Syntax = new Syntax([]);
		return new Grammar(syntax);
	}

	toString(): string {
		return this.syntax.toString();
	}
}