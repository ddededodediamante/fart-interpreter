export function evaluate(node, enviroment = {}) {
  const functions = {
    print: (...args) => {
      if (args.length < 1) {
        throw new Error("expected 1 argument, got 0");
      }
      console.log(...args);
      return null;
    },
    typeof: (x) => {
      return typeof x;
    },
    exit: () => {
      return process.exit(0);
    },
    random: (min, max, isFloat = false) => {
      if (min === undefined && max === undefined) {
        return Math.random();
      } else if (max === undefined) [max, min] = [min, 0];

      if (min > max) [min, max] = [max, min];

      if (isFloat) {
        return Math.random() * (max - min) + min;
      } else {
        return Math.floor(Math.random() * (max - min + 1)) + min;
      }
    },
    isFart: (value) => {
      return value === "fart";
    },
  };

  switch (node.type) {
    case "number":
    case "string":
    case "boolean":
      return node.value;
    case "identifier":
      if (!(node.name in enviroment)) {
        throw new Error("undefined variable: " + node.name);
      }
      return enviroment[node.name];
    case "binary": {
      const left = evaluate(node.left, enviroment);
      const right = evaluate(node.right, enviroment);

      switch (node.operator) {
        case "+":
          return left + right;
        case "-":
          return left - right;
        case "*":
          return left * right;
        case "/":
          return left / right;
        case "==":
          return left === right;
        case "!=":
          return left !== right;
        case ">":
          return left > right;
        case "<":
          return left < right;
        case ">=":
          return left >= right;
        case "<=":
          return left <= right;
        default:
          throw new Error("unknown operator " + node.operator);
      }
    }
    case "assignment": {
      const value = evaluate(node.expression, enviroment);
      enviroment[node.name] = value;
      return value;
    }
    case "call":
      if (typeof functions[node.name] === "function") {
        const args = node.arguments.map((arg) => evaluate(arg, enviroment));
        return functions[node.name](...args);
      } else {
        throw new Error("unknown function: " + node.name);
      }
    case "block": {
      let result = null;

      for (const statement of node.arguments) {
        result = evaluate(statement, enviroment);
      }

      return result;
    }
    case "if": {
      const condition = evaluate(node.condition, enviroment);
      if (condition) {
        return evaluate(node.arguments, enviroment);
      }
      return null;
    }
    default:
      throw new Error("unknown node type " + node.type);
  }
}
