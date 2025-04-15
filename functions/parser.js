export class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek() {
    return this.tokens[this.pos];
  }

  consume(expectedType, expectedValue) {
    const token = this.peek();

    if (
      !token ||
      (expectedType && token.type !== expectedType) ||
      (expectedValue != null && token.value !== expectedValue)
    ) {
      throw new Error("expected " + expectedValue + ", got " + (token.value ?? "nothing"));
    }
    this.pos++;
    return token;
  }

  parseExpression() {
    const token = this.peek();
    
    if (
      token.type === "identifier" &&
      this.tokens[this.pos + 1] &&
      this.tokens[this.pos + 1].value === "="
    ) {
      return this.parseAssignment();
    }
  
    if (token.type === "keyword" && token.value === "if") {
      return this.parseIfStatement();
    }
  
    return this.parseComparison();
  }  

  parseAssignment() {
    const idToken = this.consume("identifier");

    this.consume("operator", "=");

    return {
      type: "assignment",
      name: idToken.value,
      expression: this.parseExpression(),
    };
  }

  parseComparison() {
    let node = this.parseAdditive();
  
    while (
      this.peek() &&
      this.peek().type === "comparator"
    ) {
      const operator = this.consume("comparator");
      const right = this.parseAdditive();
      node = {
        type: "binary",
        operator: operator.value,
        left: node,
        right,
      };
    }
  
    return node;
  }

  parseAdditive() {
    let node = this.parseMultiplicative();
    while (
      this.peek() &&
      this.peek().type === "operator" &&
      (this.peek().value === "+" || this.peek().value === "-")
    ) {
      const op = this.consume("operator");
      const right = this.parseMultiplicative();
      node = {
        type: "binary",
        operator: op.value,
        left: node,
        right: right,
      };
    }
    return node;
  }

  parseMultiplicative() {
    let node = this.parsePrimary();
    while (
      this.peek() &&
      this.peek().type === "operator" &&
      (this.peek().value === "*" || this.peek().value === "/")
    ) {
      const operator = this.consume("operator");
      const right = this.parsePrimary();
      node = {
        type: "binary",
        operator: operator.value,
        left: node,
        right: right,
      };
    }
    return node;
  }

  parseFunctionCall(name) {
    this.consume("parenthesis", "(");
    const args = [];

    while (this.peek() && this.peek().value !== ")") {
      args.push(this.parseExpression());
      if (this.peek().value === ",") {
        this.consume("comma");
      } else {
        break;
      }
    }

    this.consume("parenthesis", ")");

    return {
      type: "call",
      name,
      arguments: args,
    };
  }

  parseBlock() {
    this.consume("bracket", "{");
    const statements = [];

    while (this.peek() && this.peek().value !== "}") {
      const statement = this.parseExpression();
      statements.push(statement);

      if (this.peek()?.type === "semicolon") {
        this.consume("semicolon");
      }
    }

    this.consume("bracket", "}");

    return {
      type: "block",
      arguments: statements,
    };
  }

  parseIfStatement() {
    this.consume("keyword", "if");
  
    this.consume("parenthesis", "(");
    const condition = this.parseExpression();
    this.consume("parenthesis", ")");
  
    return {
      type: "if",
      condition,
      arguments: this.parseBlock(),
    };
  }

  parsePrimary() {
    const token = this.peek();
    const { type } = token;

    if (type === "number") {
      this.consume("number");
      return { type, value: Number(token.value) };
    }

    if (type === "string") {
      this.consume("string");
      return { type, value: String(token.value) };
    }

    if (type === "boolean") {
      this.consume("boolean");
      return { type, value: Boolean(token.value) };
    }

    if (type === "identifier") {
      this.consume("identifier");

      // function call
      if (
        this.peek() &&
        this.peek().type === "parenthesis" &&
        this.peek().value === "("
      ) {
        return this.parseFunctionCall(token.value);
      }

      return { type: "identifier", name: token.value };
    }

    if (type === "parenthesis" && token.value === "(") {
      this.consume("parenthesis", "(");
      const node = this.parseExpression();
      this.consume("parenthesis", ")");
      return node;
    }

    if (type === "bracket" && token.value === "{") {
      return this.parseBlock();
    }

    throw new Error("unexpected token: " + JSON.stringify(token));
  }

  parse() {
    const ast = []; // abstract syntax tree

    while (this.pos < this.tokens.length) {
      if (this.peek().type === "semicolon") {
        this.consume("semicolon");
        continue;
      }

      ast.push(this.parseExpression());
    }

    return ast;
  }
}
