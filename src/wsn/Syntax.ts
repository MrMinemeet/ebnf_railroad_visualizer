/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Production } from './Production';
import { Sym } from '../symbols/Sym';

/**
 * A syntax is a sequence of productions defined as:
 *
 * `SYNTAX = PRODUCTION { PRODUCTION } .`
 */
export class Syntax extends Sym {
	readonly productions: Production[];

	constructor(productions: Production[], id: number = -1) {
		super(productions.map(p => p.toString()).join("\n"), id);
		this.productions = productions;
	}

	toString(): string {
		return this.productions.map(p => p.toString()).join("\n");
	}
}