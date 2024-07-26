/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Token, Kind } from './Token.js';
import { isQuote } from '../ChooChoo.js';

const LF: string = "\n";

export class Scanner {
	private readonly input: string;
	private pos: number;
	private ch: string;
	private isLiteral: boolean;
	private line: number;
	private column: number;

	constructor(input: string) {
		this.input = input;
		this.pos = 0;
		this.ch = "";
		this.nextChar();
		this.isLiteral = false;
		this.line = 1;
		this.column = 1;
	}

	next(): Token {

		if (this.pos > this.input.length) {
			// Return eof token if end of input is reached
			return new Token(Kind.eof);
		}

		const token = new Token(Kind.unknown);

		// Special handling for literals, where almost every character is valid when under double quotes
		if (this.isLiteral && !isQuote(this.ch)) {
			let chars = ""; // letter { letter }
			while (this.hasNext() && !isQuote(this.ch)) {
				// Add until the next '"' is found
				if (this.ch === " ") {
					// Make space explicitly visible
					chars += "␣";
				} else {
					chars += this.ch;
				}
				this.nextChar();
			}
			token.kind = Kind.literal;
			token.str = chars;

			return token;
		}

		// Skip whitespace characters
		while (this.pos <= this.input.length && this.isWhitespace(this.ch)) {
			this.nextChar();
		}

		if (this.pos > this.input.length) {
			// Return eof token if end of input is reached
			return new Token(Kind.eof);
		}

		// Perform quote check before switch as a helper function is used
		if (isQuote(this.ch)) {
			token.kind = Kind.quote;
			this.nextChar();
			this.isLiteral = !this.isLiteral;
			return token;
		}


		switch (this.ch) {
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
					let chars = ""; // letter { letter }
					while (this.hasNext() && /[a-zA-Z]/.test(this.ch)) {
						chars += this.ch;
						this.nextChar();
					}

					token.kind = Kind.ident;
					token.str = chars;
				} else {
					throw new Error(`(line ${this.line}, column ${this.column}) - Unknown character '${this.ch}'`);
				}
				break;
		}
		return token;
	}

	/**
	 * Get the next character from the input and skip LF symbol
	 */
	private nextChar(): void {
		this.ch = this.input[this.pos++];
		this.column++;
		if (this.ch === LF) {
			this.line++;
			this.column = 1;
			// Skip LF symbol
			this.ch = this.input[this.pos++];
		}
	}

	/**
	 * Check if there are more characters to read
	 * @returns true if there are more characters to read, otherwise false
	 */
	hasNext(): boolean {
		return this.pos < this.input.length;
	}

	private isWhitespace(ch: string): boolean {
		return !ch.replace(/\s/g, '').length;
	}

	/**
	 * Returns the position of the scanner.
	 * @returns the line and column of the scanner
	 */
	getPosition(): [number, number] {
		return [this.line, this.column];
	}
}