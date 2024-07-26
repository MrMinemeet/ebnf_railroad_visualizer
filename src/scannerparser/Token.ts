/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

export enum Kind {
	ident = "identifier",
	literal = "literal",
	eof = "EOF",
	lpar = "(",
	rpar = ")",
	lbrack = "[",
	rbrack = "]",
	lbrace = "{",
	rbrace = "}",
	period = ".",
	pipe = "|",
	assign = "=",
	quote = "\"",
	unknown = "unknown",
}

export class Token {
	kind: Kind;
	str: string = "";

	constructor(kind: Kind, ) {
		this.kind = kind;
	}

	toString(): string {
		return this.kind;
	}
}