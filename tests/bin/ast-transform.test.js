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

  test('addFunction injects a top-level function', () => {
    const original = `const a = 10;`;
    const modified = astTransform.addFunction(original, 'calculate', ['x', 'y'], 'return x * y;', true);
    expect(modified).toContain(`export function calculate(x, y) {`);
    expect(modified).toContain(`return x * y;`);
  });

  test('addFunction skips duplicate functions', () => {
    const original = `function greet() { console.log("hi"); }`;
    const modified = astTransform.addFunction(original, 'greet', [], 'console.log("duplicate");');
    expect(modified).not.toContain('duplicate');
  });

  test('modifyFunction updates function body block', () => {
    const original = `function processData(data) {\n  console.log(data);\n}`;
    const modified = astTransform.modifyFunction(original, 'processData', 'return data.map(x => x * 2);');
    expect(modified).toContain(`return data.map(x => x * 2);`);
    expect(modified).not.toContain(`console.log(data);`);
  });

  test('updateVariableAssignment updates simple variable assignment', () => {
    const original = `const port = 8080;\nlet dev = false;`;
    let modified = astTransform.updateVariableAssignment(original, 'port', 9000);
    modified = astTransform.updateVariableAssignment(modified, 'dev', true);
    expect(modified).toContain(`port = 9000`);
    expect(modified).toContain(`dev = true`);
  });

  test('addClass creates a new class declaration', () => {
    const original = `const a = 1;`;
    const modified = astTransform.addClass(original, 'User', true);
    expect(modified).toContain('export class User');
  });

  test('addClassDecorator adds decorator to class', () => {
    const original = `class User {}`;
    const modified = astTransform.addClassDecorator(original, 'User', 'Table', ['users']);
    expect(modified).toContain('@Table("users")');
    expect(modified).toContain('class User');
  });

  test('addClassMethod adds or updates class method', () => {
    const original = `class User {\n  id = 1;\n}`;
    const modified = astTransform.addClassMethod(
      original,
      'User',
      'getId',
      [],
      'return this.id;',
      [{ name: 'Get', args: ['/id'] }],
      ['public', 'async']
    );
    expect(modified).toContain('@Get("/id")');
    expect(modified).toContain('async getId() {');
    expect(modified).toContain('return this.id;');
  });

  test('addClassProperty adds or updates class property', () => {
    const original = `class User {}`;
    const modified = astTransform.addClassProperty(
      original,
      'User',
      'email',
      'string',
      '"test@example.com"',
      [{ name: 'Column', args: [] }],
      ['public']
    );
    expect(modified).toContain('@Column()');
    expect(modified).toContain('public email: string = "test@example.com";');
  });

  test('addJsxElement appends element inside target', () => {
    const original = `const App = () => <div><span>Hello</span></div>;`;
    const modified = astTransform.addJsxElement(original, { tagName: 'div' }, '<p>World</p>');
    expect(modified).toContain('<div><span>Hello</span><p>World</p></div>');
  });

  test('addJsxElement converts self-closing tag to regular element and adds child', () => {
    const original = `const App = () => <div />;`;
    const modified = astTransform.addJsxElement(original, { tagName: 'div' }, '<span />');
    expect(modified).toContain('<div><span /></div>');
  });

  test('updateJsxAttribute adds or updates attribute on element', () => {
    const original = `const App = () => <div className="foo" />;`;
    let modified = astTransform.updateJsxAttribute(original, { tagName: 'div' }, 'id', 'main-app');
    modified = astTransform.updateJsxAttribute(modified, { tagName: 'div' }, 'className', '{styles.bar}');
    expect(modified).toContain('id="main-app"');
    expect(modified).toContain('className={styles.bar}');
  });

  test('addInterface creates a new interface declaration', () => {
    const original = `const a = 1;`;
    let modified = astTransform.addInterface(original, 'User');
    expect(modified).toContain('interface User {\n}');
    
    modified = astTransform.addInterface(original, 'Admin', ['User', 'Employee']);
    expect(modified).toContain('interface Admin extends User, Employee {\n}');
  });

  test('addInterfaceProperty adds or updates property in interface', () => {
    const original = `interface User {\n  id: number;\n}`;
    let modified = astTransform.addInterfaceProperty(original, 'User', 'email', false, 'string');
    modified = astTransform.addInterfaceProperty(modified, 'User', 'phone', true, 'string');
    expect(modified).toContain('email: string;');
    expect(modified).toContain('phone?: string;');
  });

  test('addTypeAlias creates or updates type alias', () => {
    const original = `const a = 1;`;
    const modified = astTransform.addTypeAlias(original, 'UserId', 'string | number');
    expect(modified).toContain('type UserId = string | number;');
  });

  test('addImport merges named imports from the same module specifier', () => {
    const original = `import { query } from "./db.js";`;
    const modified = astTransform.addImport(original, '{ execute }', './db.js');
    expect(modified).toContain('import { query, execute } from "./db.js";');
  });

  test('addImport merges named and default imports from the same module specifier', () => {
    const original = `import { query } from "./db.js";`;
    const modified = astTransform.addImport(original, 'db', './db.js');
    expect(modified).toContain('import db, { query } from "./db.js";');
  });

  test('addImport handles true duplicate imports by returning original text', () => {
    const original = `import db, { query } from "./db.js";`;
    const modified = astTransform.addImport(original, '{ query }', './db.js');
    expect(modified).toBe(original);
  });

  test('addJsxElement and updateJsxAttribute do not match when targetSelector is empty', () => {
    const original = `const App = () => <div>Hello</div>;`;
    const modifiedElement = astTransform.addJsxElement(original, {}, '<span>World</span>');
    expect(modifiedElement).toBe(original);

    const modifiedAttribute = astTransform.updateJsxAttribute(original, {}, 'id', 'main');
    expect(modifiedAttribute).toBe(original);
  });

  test('updateJsxAttribute targets only the specific node matching tagName and attributes', () => {
    const original = `
      const App = () => (
        <div>
          <span id="target">One</span>
          <span>Two</span>
        </div>
      );
    `;
    const selector = { tagName: 'span', attributeName: 'id', attributeValue: 'target' };
    const modified = astTransform.updateJsxAttribute(original, selector, 'className', 'active');
    expect(modified).toContain('<span id="target" className="active">One</span>');
    expect(modified).toContain('<span>Two</span>');
  });

  test('updateObjectProperty serializes complex object literals and array literals', () => {
    const original = `const config = {\n  port: 8080\n};`;
    const complexObj = {
      nested: { key: "value" },
      items: [1, 2, "three"],
      flag: true
    };
    const modified = astTransform.updateObjectProperty(original, 'config', 'settings', complexObj);
    expect(modified).toContain('settings:');
    expect(modified).toContain('"nested": {');
    expect(modified).toContain('"key": "value"');
    expect(modified).toContain('"items": [');
    expect(modified).toContain('"three"');
    expect(modified).toContain('"flag": true');
  });
});


