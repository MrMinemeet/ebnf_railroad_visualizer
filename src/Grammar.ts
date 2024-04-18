/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Syntax } from "./wsn/Syntax.js";
import { Scanner } from "./scannerparser/Scanner.js";
import { Parser } from "./scannerparser/Parser.js";

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
}