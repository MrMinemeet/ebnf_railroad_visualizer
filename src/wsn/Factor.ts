/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Sym } from '../scannerparser/Sym.js';
import { Identifier } from './Identifier.js';
import { Literal } from './Literal.js';
import { Expression } from './Expression.js';

export enum FactorType {
	Identifier,
	Literal,
	Group,
	Repetition,
	Optionally,
}

/**
 * A factor is a single symbol or a group of symbols defined as:
 *
 * ```plaintext
 * FACTOR = IDENTIFIER
 *        | LITERAL
 *        | "(" EXPRESSION ")"
 *        | "{" EXPRESSION "}
 *        | "[" EXPRESSION "]" .
 * ```
 */
export class Factor extends Sym {
	readonly type: FactorType;
	readonly value: Identifier|Literal|Expression;

	constructor(type: FactorType, value: Identifier|Literal|Expression, id: number = -1) {
		let strRepr: string;
		switch (type) {
			case FactorType.Group: strRepr = `(${value})`; break;
			case FactorType.Repetition: strRepr =  `{${value}}`; break;
			case FactorType.Optionally: strRepr = `[${value}]`; break;
			default: strRepr = value.toString(); break;
		}
		super(strRepr, id);
		this.type = type;
		this.value = value;
	}

	toString(): string {
		switch (this.type) {
			case FactorType.Group: return `(${this.value})`;
			case FactorType.Repetition: return `{${this.value}}`;
			case FactorType.Optionally: return `[${this.value}]`;
			default: return this.value.toString();
		}
	}
}