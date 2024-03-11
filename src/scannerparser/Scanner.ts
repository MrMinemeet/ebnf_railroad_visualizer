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
	private wasLiteral: boolean;

	constructor(input: string) {
		this.input = input;
		this.pos = 0;
		this.ch = "";
		this.nextChar();
		this.wasLiteral = false;
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

			case '"':
				token.kind = Kind.quote;
				this.nextChar();
				this.wasLiteral = true;
				break;
			
			default:
				if (/[a-zA-Z]/.test(this.ch)) {
					let chars = "";

					if (this.wasLiteral) { // character { character }
						while (/[a-zA-Z0-9]/.test(this.ch)) {
							chars += this.ch;
							this.nextChar();
						}

						token.kind = Kind.literal;
					} else { // letter { letter }
						while (/[a-zA-Z]/.test(this.ch)) {
							chars += this.ch;
							this.nextChar();
						}

						token.kind = Kind.ident;
					}
					token.str = chars;
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