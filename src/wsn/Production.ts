/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { NTS } from '../symbols/NTS';
import { Identifier } from './Identifier';
import { Expression } from './Expression';

/**
 * A Production is a rule that defines how a non-terminal symbol is expanded into a sequence of terminal and/or non-terminal symbols. Defined as:
 *
 * `PRODUCTION = IDENTIFIER "=" EXPRESSION "." .`
 */
export class Production extends NTS {
	readonly ident: Identifier;
	readonly expr: Expression;

	constructor(ident: Identifier, expr: Expression) {
		super(`${ident} = ${expr}`);
		this.ident = ident;
		this.expr = expr;
	}

	toString(): string {
		return `${this.ident} = ${this.expr} .`;
	}
}