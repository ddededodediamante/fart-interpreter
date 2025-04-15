const process = require("process");

const { tokenize } = require("./functions/tokenization");
const { Parser } = require("./functions/parser");
const { evaluate } = require("./functions/evaluator");

function interpret(code) {
  const tokens = tokenize(code);
  const parser = new Parser(tokens);
  const ast = parser.parse(); // abstract syntax tree

  let lastResult,
    enviroment = {};

  ast.forEach((node) => {
    lastResult = evaluate(node, enviroment);
  });

  return { result: lastResult, enviroment };
}

const fileArg = process.argv.find(
  (arg) => !arg.startsWith("--") && arg.endsWith(".dde")
);

if (fileArg) {
  const fs = require("fs");

  //try {
    const data = fs.readFileSync(fileArg, "utf8");
    const result = interpret(data);
    console.log(result);
  //} catch (err) {
  //  console.error(`Error reading file ${fileArg}:`, err.message);
  //}
} else {
  console.log('A ".dde" file argument must be provided. (Usage: node index.js <path-to-file.dde>');
  process.exit(1);
}
