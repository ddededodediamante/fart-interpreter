const isDebug = process.argv.includes("--debug");
if (isDebug) console.log("[DEBUG MODE ENABLED]");

const variables = {};

const commands = {
  print: (args) => {
    console.log(args.map((i) => resolveValue(i)).join(" "));
  },
  set: (args) => {
    if (args.length < 2) {
      console.log("Usage: set <variable> <value>");
      return;
    }
    const varName = args[0];
    const valueArgs = args.slice(1);
    const maybeCmd = valueArgs[0];
    if (commands[maybeCmd]) {
      const result = processCommand(valueArgs.join(" "));
      variables[varName] = result;
      if (isDebug)
        console.log(`Set ${varName} = ${result} (evaluated from ${maybeCmd})`);
      return;
    }
    const rawValue = valueArgs.map((i) => resolveValue(i)).join(" ");
    variables[varName] = rawValue;
    if (isDebug)
      console.log(
        `Set ${varName} = ${isNaN(rawValue) ? `"${rawValue}"` : rawValue}`
      );
  },
  get: (args) => {
    if (args.length !== 1) {
      console.log("Usage: get <variable>");
      return;
    }
    const varName = args[0];
    const value = variables[varName];
    if (isDebug)
      console.log(
        value !== undefined
          ? `${varName} = ${value}`
          : `Variable ${varName} not set.`
      );
    return value;
  },
  sum: (args) => {
    if (args.length !== 2) {
      console.log("Usage: sum <num1> <num2>");
      return;
    }
    const num1 = resolveValue(args[0]);
    const num2 = resolveValue(args[1]);
    if (isNaN(num1) || isNaN(num2)) {
      console.log("Both arguments must be numbers.");
      return;
    }
    let result = num1 + num2;
    if (isDebug) console.log(`${num1} + ${num2} = ${result}`);
    return result;
  },
  reduce: (args) => {
    if (args.length !== 2) {
      console.log("Usage: reduce <num1> <num2>");
      return;
    }
    const num1 = resolveValue(args[0]);
    const num2 = resolveValue(args[1]);
    if (isNaN(num1) || isNaN(num2)) {
      console.log("Both arguments must be numbers.");
      return;
    }
    let result = num1 - num2;
    if (isDebug) console.log(`${num1} - ${num2} = ${result}`);
    return result;
  },
  exit: () => {
    if (isDebug) console.log("Exiting interpreter.");
    process.exit(0);
  },
};

function resolveValue(val) {
  const strVal = String(val);
  if (strVal.startsWith("$")) {
    const varName = val.slice(1);
    const stored = variables[varName];
    if (stored !== undefined) return isNaN(stored) ? stored : Number(stored);
    return NaN;
  }
  if (strVal.startsWith("(") && strVal.endsWith(")")) {
    const inner = val.slice(1, -1).trim();
    return processCommand(inner);
  }
  return isNaN(val) ? val : Number(val);
}

function tokenize(line) {
  let tokens = [];
  let current = "";
  let parenDepth = 0;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === "(") {
      if (parenDepth > 0) current += char;
      parenDepth++;
      if (parenDepth === 1) current = "";
    } else if (char === ")") {
      parenDepth--;
      if (parenDepth > 0) current += char;
      else {
        tokens.push("(" + current.trim() + ")");
        current = "";
      }
    } else if (/\s/.test(char)) {
      if (parenDepth > 0) current += char;
      else if (current.length > 0) {
        tokens.push(current);
        current = "";
      }
    } else {
      current += char;
    }
  }
  if (current.length > 0 && parenDepth === 0) tokens.push(current);
  return tokens;
}

function processCommand(line) {
  const trimmed = line.trim();
  if (!trimmed) return;
  const tokens = tokenize(trimmed);
  const cmd = tokens[0];
  const args = tokens.slice(1).map(resolveValue);
  if (cmd === "#") return;
  if (commands[cmd]) return commands[cmd](args);
  else console.log(`Unknown command: ${cmd}`);
}

const fileArg = process.argv.find(
  (arg) => !arg.startsWith("--") && arg.endsWith(".dde")
);

if (fileArg) {
  const fs = require("fs");
  try {
    const data = fs.readFileSync(fileArg, "utf8");
    data.split(/\r?\n/).forEach((line) => processCommand(line));
  } catch (err) {
    console.error(`Error reading file ${fileArg}:`, err.message);
  }
} else {
  const readline = require("readline");
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">> ",
  });
  rl.prompt();
  rl.on("line", (line) => {
    processCommand(line);
    rl.prompt();
  }).on("close", () => process.exit(0));
}
