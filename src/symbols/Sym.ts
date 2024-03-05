/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

/**
 * Base class for all parts of a grammar (terminal symbols and non-terminal symbols).
 * Holds the name of the part and the follow parts of the part.
 *
 * See:
 * * {@link NTS}
 * * {@link TS}
 */
export abstract class Sym {
	readonly name: string;

	constructor(name: string) {
		this.name = name;
	}

	/** Tells whether the part is a terminal symbol or a non-terminal symbol*/
	abstract isExpandable(): boolean;

	/** Returns the first part of the production */
	abstract first(): Sym[];

	abstract equals(other: Sym): boolean;

	toString(): string {
		return this.name;
	}
}