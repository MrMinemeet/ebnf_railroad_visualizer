/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { NTS } from '../symbols/NTS';
import { Term } from './Term';

/**
 * A sequence of terms defined as:
 * 
 * `EXPRESSION = TERM { "|" TERM } .`
 */
export class Expression extends NTS {
	readonly terms: Term[];

	constructor(terms: Term[]) {
		super(terms.map(t => t.toString()).join(" | "));
		this.terms = terms;
	}

	toString(): string {
		return this.terms.map(t => t.toString()).join(" | ");
	}
}