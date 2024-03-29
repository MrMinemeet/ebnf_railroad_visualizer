/*
 * Copyright (c) 2024. Alexander Voglsperger
 */

import { Grammar } from "./Grammar";
import { Diagram } from "./Diagram";
import fs from "fs";

const grammarString = `
Path = Dir { Dir } Name .
Dir = ( Name | "." [ "." ] ) "/" .
Name = an { an } .
`;

const g = Grammar.fromString(grammarString);

console.log(`Parsed Grammar as String: \n${g.toString()}\n`);

const diagram = new Diagram(g);
fs.mkdirSync("test", { recursive: true });
fs.writeFileSync("test/diagram.html", diagram.toHtml([1, 8]), "utf-8");
console.log("done!");