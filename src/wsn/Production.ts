/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
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