/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

export enum Kind {
	ident = "identifier",
	literal = "literal",
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