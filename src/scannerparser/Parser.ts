/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Token, Kind } from "./Token";
import { Scanner } from "./Scanner";
import { Syntax } from "../wsn/Syntax";
import { Production } from "../wsn/Production";
import { Term } from "../wsn/Term";
import { Identifier, letter } from "../wsn/Identifier";
import { Expression } from "../wsn/Expression";
import { Factor, FactorType } from "../wsn/Factor";
import { Literal, character } from "../wsn/Literal";

//const LF: string = "\n";


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

	parse(): Syntax {
		this.scan();
		return this.Syntax();
	}

	private Syntax(): Syntax {
		console.debug("Syntax()");
		const productions: Production[] = [];
		// eslint-disable-next-line no-constant-condition
		while (this.sym !== Kind.eof && this.sym === Kind.ident) {
			productions.push(this.Production());
		}

		return new Syntax(productions);
	}

	private Production(): Production {
		console.debug("Production()");
		const ident = this.Identifier();
		this.check(Kind.assign);
		const expr = this.Expression();
		this.check(Kind.period);

		return new Production(ident, expr);
	}

	private Identifier(): Identifier {
		console.debug("Identifier()");
		if (this.sym !== Kind.ident) {
			throw new Error(`Syntax error: unexpected token '${this.t}'`);
		}
		this.scan();

		const letters: letter[] = [];
		for (const c of this.t.str) {
			letters.push(c as letter);
		}

		// TODO: Create popper identifier instance
		return new Identifier(letters);
	}

	private Expression(): Expression {
		console.debug("Expression()");
		const terms: Term[] = [];
		terms.push(this.Term());

		while (this.sym === Kind.pipe) {
			this.scan();
			terms.push(this.Term());
		}

		return new Expression(terms);
	}

	private Term(): Term {
		console.debug("Term()");
		const factors: Factor[] = [];

		factors.push(this.Factor());

		// TODO: Continue for "{ Factor() }"
		while (this.sym === Kind.ident || this.sym === Kind.literal ||
			this.sym === Kind.quote || this.sym === Kind.lpar || 
			this.sym === Kind.lbrace ||this.sym === Kind.lbrack)
		{
			factors.push(this.Factor());
		}



		return new Term(factors);
	}

	private Factor(): Factor {
		console.debug("Factor()");
		let factor: Factor;
		let expr: Expression;
		switch (this.sym) {
			case Kind.ident: // IDENTIFIER
				factor = new Factor(FactorType.Identifier, this.Identifier());
				break;

			case Kind.quote: // "\"" LITERAL "\""
				factor = new Factor(FactorType.Identifier, this.Literal());
				break;

			case Kind.lpar: // "(" EXPRESSION ")"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rpar);
				factor = new Factor(FactorType.Group, expr);
				break;

			case Kind.lbrace: // "{" EXPRESSION "}"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rbrace);
				factor = new Factor(FactorType.Repetition, expr);
				break;

			case Kind.lbrack: // "[" EXPRESSION "]"
				this.scan();
				expr = this.Expression();
				this.check(Kind.rbrack);
				factor = new Factor(FactorType.Optionally, expr);
				break;
				
			default:
				throw new Error(`Syntax error: unexpected token '${this.t}'`);
		}

		return factor;
	}

	private Literal(): Literal {
		console.debug("Literal()");
		const chars: character[] = [];

		this.check(Kind.quote);
		if (this.sym !== Kind.literal) {
			throw new Error(`Syntax error: expected literal but found '${this.la}'`);
		}

		for (const c of this.la.str) {
			chars.push(c as character);
		}
		this.scan();
		this.check(Kind.quote);

		return new Literal(chars);
	}


	/**
	 * Checks if the lookahead token has the expected {@link Kind} and scans the next.4
	 * @param expected expeced kind of lookahead token or unexpected end
	 */
	private check(expected: Kind): void {
		if (!this.scanner.hasNext()) {
			throw new Error("Unexpected end of input");
		}
		if (this.sym !== expected) {
			throw new Error(`Syntax error: '${expected}' expected but '${this.t}' found`);
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
}