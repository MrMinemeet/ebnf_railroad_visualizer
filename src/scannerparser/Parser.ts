/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Token, Kind } from "./Token.js";
import { Scanner } from "./Scanner.js";
import { Syntax } from "../wsn/Syntax.js";
import { Production } from "../wsn/Production.js";
import { Term } from "../wsn/Term.js";
import { Identifier, letter } from "../wsn/Identifier.js";
import { Expression } from "../wsn/Expression.js";
import { Factor, FactorType } from "../wsn/Factor.js";
import { Literal } from "../wsn/Literal.js";


export class Parser {
	private readonly scanner: Scanner;
	private t: Token;
	private la: Token;
	private sym: Kind;
	private idCounter: number = 0;

	constructor(scanner: Scanner) {
		this.scanner = scanner;
		this.t = new Token(Kind.unknown);
		this.la = new Token(Kind.unknown);
		this.sym = Kind.unknown;
	}

	parse(): Syntax {
		this.scan();
		return this.Syntax();
	}

	private Syntax(): Syntax {
		const productions: Production[] = [];
		while (this.sym !== Kind.eof) {
			productions.push(this.Production());
		}
		this.scan();
		return new Syntax(productions, this.idCounter++);
	}

	private Production(): Production {
		const ident = this.Identifier();
		this.check(Kind.assign);
		const expr = this.Expression();
		this.check(Kind.period);

		return new Production(ident, expr, this.idCounter++);
	}

	private Identifier(): Identifier {
		if (this.sym !== Kind.ident) {
			this.throwError(`expected identifier but found '${this.t}'`);
		}
		this.scan();

		const letters: letter[] = [];
		for (const c of this.t.str) {
			letters.push(c as letter);
		}

		return new Identifier(letters, this.idCounter++);
	}

	private Expression(): Expression {
		const terms: Term[] = [];
		terms.push(this.Term());

		while (this.sym === Kind.pipe) {
			this.scan();
			terms.push(this.Term());
		}

		return new Expression(terms, this.idCounter++);
	}

	private Term(): Term {
		const factors: Factor[] = [ this.Factor() ];

		while (this.sym === Kind.ident || this.sym === Kind.literal ||
			this.sym === Kind.quote || this.sym === Kind.lpar ||
			this.sym === Kind.lbrace ||this.sym === Kind.lbrack)
		{
			factors.push(this.Factor());
		}

		return new Term(factors, this.idCounter++);
	}

	private Factor(): Factor {
		let factor: Factor;
		let expr: Expression;
		switch (this.sym) {
			case Kind.ident: // IDENTIFIER
				factor = new Factor(FactorType.Identifier, this.Identifier(), this.idCounter++);
				break;

			case Kind.quote: // "\"" LITERAL "\""
				factor = new Factor(FactorType.Identifier, this.Literal(), this.idCounter++);
				break;

			case Kind.lpar: // "(" EXPRESSION ")"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rpar);
				factor = new Factor(FactorType.Group, expr, this.idCounter++);
				break;

			case Kind.lbrace: // "{" EXPRESSION "}"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rbrace);
				factor = new Factor(FactorType.Repetition, expr, this.idCounter++);
				break;

			case Kind.lbrack: // "[" EXPRESSION "]"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rbrack);
				factor = new Factor(FactorType.Optionally, expr, this.idCounter++);
				break;

			default:
				this.throwError(`expected identifier, '"', '(', '{' or '[' but found '${this.t}'`);
		}

		return factor;
	}

	private Literal(): Literal {
		let characters: string = "";

		this.check(Kind.quote);
		if (this.sym !== Kind.literal) {
			this.throwError(`expected literal but found '${this.la}'`);
		}

		characters = this.la.str;
		this.scan();
		this.check(Kind.quote);

		return new Literal(characters, this.idCounter++);
	}


	/**
	 * Checks if the lookahead token has the expected {@link Kind} and scans the next.4
	 * @param expected expeced kind of lookahead token or unexpected end
	 */
	private check(expected: Kind): void {
		if (this.sym !== expected) {
			this.throwError(`expected '${expected}' but found '${this.t}'`);
		}

		this.scan();
	}

	/**
	 * Scans the next token from the input and stores it into {@link la}.
	 */
	private scan(): void {
		this.t = this.la;
		this.la = this.scanner.next();
		this.sym = this.la.kind;
	}

	private throwError(message: string): never {
		const [line, col] = this.scanner.getPosition();
		throw new Error(`(line ${line}, column ${col}) - ${message}`);
	}
}