/**
 * AST Graph Transform Tests
 * Tests direct node manipulation inside TypeScript/JavaScript syntax trees.
 */

describe('AST Transform Engine', () => {
  let astTransform;

  beforeEach(() => {
    const transformPath = require.resolve('../../bin/ast_transform.js');
    delete require.cache[transformPath];
    astTransform = require('../../bin/ast_transform.js');
  });

  test('addImport inserts a default import node programmatically', () => {
    const original = `const a = 10;\nconsole.log(a);`;
    const modified = astTransform.addImport(original, 'db', './db.js');
    expect(modified).toContain(`import db from "./db.js";`);
    expect(modified).toContain(`const a = 10;`);
  });

  test('addImport inserts named imports programmatically', () => {
    const original = `const a = 10;`;
    const modified = astTransform.addImport(original, '{ query, execute }', './db.js');
    expect(modified).toContain(`import { query, execute } from "./db.js";`);
  });

  test('addImport skips duplicate import statements', () => {
    const original = `import db from "./db.js";\nconst a = 10;`;
    const modified = astTransform.addImport(original, 'db', './db.js');
    // Resulting occurrences of import should be 1
    const count = (modified.match(/import db from "\.\/db\.js"/g) || []).length;
    expect(count).toBe(1);
  });

  test('addMethod appends a new method to a class declaration AST node', () => {
    const original = `class UserProfile {\n  name = "John";\n}`;
    const modified = astTransform.addMethod(
      original,
      'UserProfile',
      'greet',
      ['msg'],
      'console.log(msg + this.name);'
    );
    expect(modified).toContain(`greet(msg) {`);
    expect(modified).toContain(`console.log(msg + this.name);`);
  });

  test('addMethod skips duplicate method signatures', () => {
    const original = `class UserProfile {\n  greet(msg) {\n    console.log(msg);\n  }\n}`;
    const modified = astTransform.addMethod(
      original,
      'UserProfile',
      'greet',
      ['msg', 'extra'],
      'console.log("duplicate test");'
    );
    expect(modified).not.toContain(`duplicate test`);
  });

  test('updateObjectProperty modifies existing assignment value', () => {
    const original = `const config = {\n  port: 8080,\n  debug: false\n};`;
    const modified = astTransform.updateObjectProperty(original, 'config', 'port', 9000);
    expect(modified).toContain(`port: 9000`);
    expect(modified).not.toContain(`port: 8080`);
  });

  test('updateObjectProperty appends a new property when not present', () => {
    const original = `const config = {\n  port: 8080\n};`;
    const modified = astTransform.updateObjectProperty(original, 'config', 'debug', true);
    expect(modified).toContain(`port: 8080`);
    expect(modified).toContain(`debug: true`);
  });
});
