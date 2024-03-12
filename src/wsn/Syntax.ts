/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Production } from './Production';
import { NTS } from '../symbols/NTS';

/**
 * A syntax is a sequence of productions defined as:
 *
 * `SYNTAX = PRODUCTION { PRODUCTION } .`
 */
export class Syntax extends NTS {
	readonly productions: Production[];

	constructor(productions: Production[]) {
		super(productions.map(p => p.toString()).join("\n"));
		this.productions = productions;
	}

	toString(): string {
		return this.productions.map(p => p.toString()).join("\n");
	}
}