"use strict";import{Grammar as t}from"./Grammar.js";import{Diagram as a}from"./Diagram.js";import r from"fs";const m=`
Path = Dir { Dir } Name .
Dir = ( Name | "." [ "." ] ) "/" .
Name = an { an } .
`,o=t.fromString(m);console.log(`Parsed Grammar as String: 
${o.toString()}
`);const i=a.fromString(m);r.mkdirSync("test",{recursive:!0}),r.writeFileSync("test/diagram.svg",i.toSvg(),"utf-8"),console.log("done!");
