/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { NTS } from '../symbols/NTS';
import { Sym } from '../symbols/Sym';

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
export class Factor extends NTS {
	readonly type: FactorType;
	readonly value: Sym;

	constructor(type: FactorType, value: Sym) {
		let strRepr: string;
		switch (type) {
			case FactorType.Group: strRepr = `(${value})`; break;
			case FactorType.Repetition: strRepr =  `{${value}}`; break;
			case FactorType.Optionally: strRepr = `[${value}]`; break;
			default: strRepr = value.toString(); break;
		}
		super(strRepr);
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