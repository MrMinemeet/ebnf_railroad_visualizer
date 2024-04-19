/*
 * Copyright (c) 2024. Alexander Voglsperger
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