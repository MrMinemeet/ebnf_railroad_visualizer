/*
 * This work © 2024 by Alexander Voglsperger is licensed under CC BY 4.0.
 * To view a copy of this license, see the provided LICENSE file or visit https://creativecommons.org/licenses/by/4.0/
 */

import { Grammar } from "./Grammar.js";
import { Diagram } from "./Diagram.js";
import fs from "fs";

const grammarString = `
Path = Dir { Dir } Name .
Dir = ( Name | "." [ "." ] ) "/" .
Name = an { an } .
`;

const g = Grammar.fromString(grammarString);

console.log(`Parsed Grammar as String: \n${g.toString()}\n`);

const diagram = Diagram.fromString(grammarString);
fs.mkdirSync("test", { recursive: true });
fs.writeFileSync("test/diagram.svg", diagram.toSvg(), "utf-8");
console.log("done!");