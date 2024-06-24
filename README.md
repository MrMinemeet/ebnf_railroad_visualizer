# EBNF Railroad Diagram Visualizer
A client-side browser-based tool for visualizing EBNF grammars as railroad diagrams.
Uses the [Wirth Syntax Notation](https://en.wikipedia.org/wiki/Wirth_syntax_notation) (*WSN*) for EBNF, as this is the common format used by the [Institute for System Software](https://ssw.jku.at/) (SSW) at Johannes Kepler University.

This project is a part of the course [Project in Software Engineering](https://ssw.jku.at/Teaching/Lectures/PSE/2024SS/index.html) at the SSW and is supervised by [Dr. Markus Weninger](https://ssw.jku.at/General/Staff/Weninger/).

## Usage
The grammar expects a correctly formatted EBNF grammar in WSN. Uppercase identifiers are treated as Non-Terminal Symbols (*NTS*). Lowercase identifiers are treated as Terminal Symbols (*TS*) which cannot be broken down further, e.g. `an` which may stand for a-z, A-Z and 0-9.

The grammar is automatically parsed and visualized as a railroad diagram when an input is detected. Errors are displayed below the input grammar if any occur.

## Example
The following input results in the railroad diagram below:
```ebnf
Path = Dir { Dir } Name .
Dir = ( Name | "." [ "." ] ) "/" .
Name = an { an } .
```
![Example railroad diagram for given grammar](./images/basic_railroad_diagram.svg)

Try it out yourself with this [LINK](https://wtf-my-code.works/rr-diagram/?grammar=UGF0aCA9IERpciB7IERpciB9IE5hbWUgLgpEaXIgPSAoIE5hbWUgfCAiLiIgWyAiLiIgXSApICIvIiAuCk5hbWUgPSBhbiB7IGFuIH0gLg).

## Features
* **Error Information:** In the case that an error occurs during scanning or parsing of the input grammar, a small description is written below the grammar as shown:  
![Example of message for faulty grammar](./images/faulty_grammar_input.jpg)

* **NTS Expansion:** NTS are displayed as rectangles and can be expanded by clicking them. The definition of the NTS is then displayed in a dashed box as shown:  
![Example railroad diagram with expanded NTS](./images/expanded_railroad_diagram.svg)  [Link to Example](https://wtf-my-code.works/rr-diagram/?grammar=UGF0aCA9IERpciB7IERpciB9IE5hbWUgLgpEaXIgPSAoIE5hbWUgfCAiLiIgWyAiLiIgXSApICIvIiAuCk5hbWUgPSBhbiB7IGFuIH0gLg&expand=MTItMTEtMTAtMi0xfDEyLTExLTEwLTktOA)

* **URL Encoded Grammar:** Grammar is base64URL encoded into the URL. This allows for easy sharing of the current grammar by copying the URL or bookmarking it. The encoding also includes the list of expanded NTS.  
The URL encoding also utilizes `lz-string` to compress the grammar and expand parameter in order to reduce their length. A size comparison was performed on the grammar for [MicroJava](https://www.ssw.jku.at/Misc/CC/Handouts.pdf) with the following results (character count):

|Grammar|URL Encoded|Base64 Encoded|lz-string Compressed Base64|
|-------|-----------|--------------|---------------------------|
|   1241|       2305|          1656|                        916|
|   100%|     185,7%|        133.4%|                      73,8%|

This only includes the grammar length, not the encoded expands. 

* **Selectable Start Symbols:** The start symbol can be selected by either choosing the desired NTS in the dropdown menu or by performing a *CTRL + L-Click* on it in the railroad diagram. By default the declared NTS of the first production is used. The selected start symbol is also encoded in the URL for easy sharing.

* **Compacted 0…n Repetition:**
If the repetition only contains of TS, then the content is compacted onto the back-edge and the forward-edge is kept empty. This is shown in the following picture:  
![Example railroad diagram with compacted repetition](./images/ts_only_optional_loop.svg) [Link to Example](https://wtf-my-code.works/rr-diagram/?start=Example&grammar=RXhhbXBsZSA9IHsgIiwiIHggfSAu)

* **1…n Repetition detection:** 
The repetition detection has two versions that are applied
	1. *Advanced Repetition Detection* - for e.g. `x { "," x }`, which removes the `x` in front of the repetition and converts the repetition to a `ZeroOrMore` repetition. The inner `x` is on the forward edge of the repetition and the `","` being on the backward edge as shown in the following picture:  
	![Example railroad diagram with advanced repetition](./images/advanced_repetition.svg) [Link to Example](https://wtf-my-code.works/rr-diagram/?start=Example&grammar=RXhhbXBsZSA9IHggeyAiLCIgeCB9IC4&expand=MTItMTEtMTAtNi01LTQtM3wxMi0xMS0xMC04)

	2. *Basic Repetition Detection* - for e.g. `x { x }`, which removes the `x` in front of the repetition and converts the repetition to a `OneOrMore` repetition. The inner `x` is on the forward edge of the repetition as shown in the following picture:  
	![Example railroad diagram with basic repetition](./images/basic_repetition.svg) [Link to Example](https://wtf-my-code.works/rr-diagram/?start=Example&grammar=RXhhbXBsZSA9IHggeyB4IH0gLg)

## TODOs
* Make UI nicer and a bit more user-friendly. Maybe also add some instructions and a dark mode 🌕

## Included Dependencies / Other Resources
- [railroad.js](https://github.com/tabatkins/railroad-diagrams) by Tab Atkins Jr. et. al (with some modifications, see comment in the file at line ~16) | Provided as MIT (according to Github Repository) and CC0 (according to file itself)
- [github-mark.svg](https://github.com/logos) by GitHub
- [lz-string.js](https://github.com/pieroxy/lz-string) by pieroxy | Provided as MIT
- [D3](https://github.com/d3/d3) by Mike Bostock et. al | Provided as ISC
