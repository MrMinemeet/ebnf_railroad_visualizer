/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Factor } from "./Factor";
import { NTS } from "../symbols/NTS";

/**
 * A Term is a sequence of factors defined as:
 *
 * `TERM = FACTOR { FACTOR } .`
 */
export class Term extends NTS {
	readonly factors: Factor[];

	constructor(factors: Factor[]) {
		if (factors.length === 0) {
			throw new Error("A term must have at least one factor");
		}
		super(factors.map(f => f.toString()).join(" "));
		this.factors = factors;
	}

	toString(): string {
		return this.factors.map(f => f.toString()).join(" ");
	}
}