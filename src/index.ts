/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Grammar } from "./Grammar";

const grammarString = 'Xu = char Y "a" .';
/*
Y = number .
Y = number number .
*/

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const g = Grammar.fromString(grammarString);

console.log(g.toString());
console.log("done!");