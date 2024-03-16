/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Sym } from '../scannerparser/Sym.js';
import { Identifier } from './Identifier.js';
import { Expression } from './Expression.js';

/**
 * A Production is a rule that defines how a non-terminal symbol is expanded into a sequence of terminal and/or non-terminal symbols. Defined as:
 *
 * `PRODUCTION = IDENTIFIER "=" EXPRESSION "." .`
 */
export class Production extends Sym {
	readonly ident: Identifier;
	readonly expr: Expression;

	constructor(ident: Identifier, expr: Expression, id: number = -1) {
		super(`${ident} = ${expr}`, id);
		this.ident = ident;
		this.expr = expr;
	}

	toString(): string {
		return `${this.ident} = ${this.expr} .`;
	}
}