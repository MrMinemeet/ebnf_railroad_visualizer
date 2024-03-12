/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

/*
 *     ooOOOO
 *    oo      _____
 *   _I__n_n__||_|| ________
 * >(_________|_7_|-|______|
 *  /o ()() ()() o   oo  oo
 *
 * This file is my "utils.ts" version, for stuff that I need, doesn't fit somewhere
 * else and/or is not provided my TS/JS per default.
 */


/**
 * Checks if a word starts with an uppercase letter.
 *
 * Because of course TS/JS doesn't have a built-in function for that.
 * @param word The word to check.
 * @returns `true` if the word starts with an uppercase letter, `false` otherwise.
 */
export function isUppercase(word: string): boolean {
	return /^\p{Lu}/u.test( word );
}