/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Grammar } from "./Grammar";
import { Diagram } from "./Diagram";
import fs from "fs";

const grammarString = `
Xu = char Y "a" .
`;
// Y = number .
// Y = number number .

const g = Grammar.fromString(grammarString);

console.log(`Parsed Grammar as String: \n${g.toString()}\n\n`);

const diagram = new Diagram(g);
console.log(`Diagram as String: \n${diagram.toString()}\n\n`);
fs.writeFileSync("test/diagram.html", diagram.toHtml(), "utf-8");
console.log("done!");