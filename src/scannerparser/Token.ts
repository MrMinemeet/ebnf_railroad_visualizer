/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

export enum Kind {
	ident = "identifier",
	literal = "literal",
	lpar = "(",
	rpar = ")",
	lbrak = "[",
	rbrak = "]",
	lbrace = "{",
	rbrace = "}",
	period = ".",
	pipe = "|",
	assign = "=",
	unknown = "unknown",
}

export class Token {
	type: Kind;
	str: string = "";

	constructor(type: Kind, ) {
		this.type = type;
	}

	toString(): string {
		return this.type;
	}
}