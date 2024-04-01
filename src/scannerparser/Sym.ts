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
	readonly id: number;

	constructor(name: string, id: number = -1) {
		this.name = name;
		this.id = id;
	}

	toString(): string {
		return (this.id === -1) ? this.name : `${this.name} (${this.id})`;
	}
}