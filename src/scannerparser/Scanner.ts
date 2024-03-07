/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Token } from './Token';
import { Kind } from './Token';

export class Scanner {
	static readonly LF = "\n";

	readonly input: string;
	private pos: number;
	private ch: string;

	constructor(input: string) {
		this.input = input;
		this.pos = 0;
		this.ch = "";
		this.nextChar();
	}

	next(): Token {

		// Skip whitespace characters
		while (this.pos < this.input.length && this.isWhitespace(this.ch)) {
			this.nextChar();
		}

		const token = new Token(Kind.unknown);

		switch (this.ch) {
			// ---- Simple tokens ----
			case "(":
				token.kind = Kind.lpar;
				this.nextChar();
				break;
			case ")":
				token.kind = Kind.rpar;
				this.nextChar();
				break;
			case "[":
				token.kind = Kind.lbrack;
				this.nextChar();
				break;
			case "]":
				token.kind = Kind.rbrack;
				this.nextChar();
				break;
			case "{":
				token.kind = Kind.lbrace;
				this.nextChar();
				break;
			case "}":
				token.kind = Kind.rbrace;
				this.nextChar();
				break;
			case ".":
				token.kind = Kind.period;
				this.nextChar();
				break;
			case "|":
				token.kind = Kind.pipe;
				this.nextChar();
				break;
			case "=":
				token.kind = Kind.assign;
				this.nextChar();
				break;
			
			default:
				if (/[a-zA-Z]/.test(this.ch)) {
					// Identifier (--> letter { letter })
					let ident = "";
					while (/[a-zA-Z]/.test(this.ch)) {
						ident += this.ch;
						this.nextChar();
					}
					token.kind = Kind.ident;
					token.str = ident;
				} else if (this.ch === "\"") {
					// Literal (--> " character { character } ")
					let literal = "";
					this.nextChar();
					while (this.ch !== "\"") {
						literal += this.ch;
						this.nextChar();
					}
					this.nextChar();
					token.kind = Kind.literal;
					token.str = literal;
				} else {
					throw new Error(`Unknown character: ${this.ch}`);
				}
				break;
		}
		return token;
	}

	private nextChar(): void {
		this.ch = this.input[this.pos++];
		if (this.ch === Scanner.LF) {
			// Skip LF symbol
			this.ch = this.input[this.pos++];
		}
	}

	hasNext(): boolean {
		return this.pos < this.input.length;
	}

	private isWhitespace(ch: string): boolean {
		return !ch.replace(/\s/g, '').length;
	}
}