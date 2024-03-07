/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Token, Kind } from "./Token";
import { Scanner } from "./Scanner";

export class Parser {
	private readonly scanner: Scanner;
	private t: Token;
	private la: Token;
	private sym: Kind;

	constructor(scanner: Scanner) {
		this.scanner = scanner;
		this.t = new Token(Kind.unknown);
		this.la = new Token(Kind.unknown);
		this.sym = Kind.unknown;
	}

	parse(): void {
		this.scan();
		this.Syntax();
	}

	private Syntax(): void {
		// eslint-disable-next-line no-constant-condition
		while (true) {
			if (this.sym === Kind.ident) {
				this.Production();
			} else {
				break;
			}
		}
	}

	private Production(): void {
		this.Identifier();
		this.check(Kind.assign);
		this.Expression();
		this.check(Kind.period);
	}

	private Identifier(): void {
		while (this.sym === Kind.ident) {
			this.scan();
		}
	}

	private Expression(): void {
		this.Term();

		while (this.sym === Kind.pipe) {
			this.scan();
			this.Term();
		}
	}

	private Term(): void {
		this.Factor();

		// TODO: Continue for "{ Factor() }"
	}

	private Factor(): void {
		switch (this.sym) {
			case Kind.ident: // IDENTIFIER
				this.Identifier();
				break;
			case Kind.quote: // "\"" LITERAL "\""
				this.Literal();
				break;
			case Kind.lpar: // "(" EXPRESSION ")"
				this.scan();
				this.Expression();
				this.check(Kind.rpar);
				break;
			case Kind.lbrace: // "{" EXPRESSION "}"
				this.scan();
				this.Expression();
				this.check(Kind.rbrace);
				break;
			case Kind.lbrack: // "[" EXPRESSION "]"
				this.scan();
				this.Expression();
				this.check(Kind.rbrack);
				break;
			default:
				throw new Error(`Syntax error: unexpected token '${this.t}'`);
		}
	}

	private Literal(): void {
		this.check(Kind.quote);
		while (this.sym === Kind.literal) {
			this.scan();
		}
		this.check(Kind.quote);
	}


	/**
	 * Checks if the lookahead token has the expected {@link Kind} and scans the next.
	 * @param expected expeced kind of lookahead token
	 */
	private check(expected: Kind): void {
		if (this.sym === expected) {
			this.scan();
		} else {
			throw new Error(`Syntax error: '${this.t}' expected`);
		}
	}

	/**
	 * Scans the next token from the input and stores it into {@link la}.
	 */
	private scan(): void {
		this.t = this.la;
		this.la = this.scanner.next();
		this.sym = this.la.kind;
	}
}