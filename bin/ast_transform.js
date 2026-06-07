const ts = require('typescript');
const fs = require('node:fs');

/**
 * Traverses an AST node recursively and strips source file position mapping
 * to force the TypeScript printer to treat it as a synthesized node.
 * Prevents corrupted output when nodes are moved between source files.
 */
function stripPositions(node) {
  if (!node) return;
  node.pos = -1;
  node.end = -1;
  node.parent = undefined;
  ts.forEachChild(node, stripPositions);
}

/**
 * 📐 AST Code-as-a-Graph Transformation Engine
 * Provides structured programmatic APIs to manipulate the syntax tree directly.
 * Prevents syntax errors, structural conflicts, and formatting debates entirely.
 */
class ASTTransformEngine {
  /**
   * Helper to parse a source file.
   */
  _parse(filePath, content) {
    return ts.createSourceFile(
      filePath,
      content,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TS
    );
  }

  /**
   * Helper to print AST nodes back to source text.
   */
  _print(sourceFile) {
    const printer = ts.createPrinter({ newLine: ts.NewLineKind.LineFeed });
    return printer.printFile(sourceFile);
  }

  /**
   * Injects an import declaration at the top of the file if not already present.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} importSpecifier - e.g., "db" or "{ query }"
   * @param {string} moduleSpecifier - e.g., "./db.js"
   * @returns {string} Modified source file text.
   */
  addImport(sourceText, importSpecifier, moduleSpecifier) {
    const sourceFile = this._parse('temp.ts', sourceText);
    
    // Check if duplicate import already exists
    let duplicate = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        if (ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === moduleSpecifier) {
          duplicate = true;
        }
      }
    });

    if (duplicate) return sourceText;

    // Build the ImportDeclaration AST node
    // Simple parsing of imports
    const isNamed = importSpecifier.startsWith('{') && importSpecifier.endsWith('}');
    let importClause;

    if (isNamed) {
      const names = importSpecifier.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
      const elements = names.map(name => 
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
      );
      importClause = ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports(elements)
      );
    } else {
      // Default import
      importClause = ts.factory.createImportClause(
        false,
        ts.factory.createIdentifier(importSpecifier),
        undefined
      );
    }

    const newImport = ts.factory.createImportDeclaration(
      undefined,
      importClause,
      ts.factory.createStringLiteral(moduleSpecifier),
      undefined
    );

    // Insert new import node at index 0
    const updatedStatements = [newImport, ...sourceFile.statements];
    const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
    return this._print(updatedSourceFile);
  }

  /**
   * Injects a method into a target ClassDeclaration.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} className - Class name to target.
   * @param {string} methodName - Name of method to insert.
   * @param {string[]} parameters - Parameters array e.g., ["id", "data"]
   * @param {string} methodBodyText - Method body statement text block.
   * @returns {string} Modified source file text.
   */
  addMethod(sourceText, className, methodName, parameters, methodBodyText) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isClassDeclaration(node) && node.name && node.name.text === className) {
          // Check if method already exists
          const exists = node.members.some(member => 
            ts.isMethodDeclaration(member) && ts.isIdentifier(member.name) && member.name.text === methodName
          );

          if (exists) return node;

          // Build parameter nodes
          const paramNodes = parameters.map(p => 
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createIdentifier(p),
              undefined,
              undefined,
              undefined
            )
          );

          // Parse method body block from string
          // We wrap the body in a temporary source file statements parser
          const tempSource = ts.createSourceFile('temp_body.ts', `function temp() { ${methodBodyText} }`, ts.ScriptTarget.Latest, true);
          let parsedBlock;
          ts.forEachChild(tempSource, (child) => {
            if (ts.isFunctionDeclaration(child) && child.body) {
              parsedBlock = child.body;
            }
          });

          if (!parsedBlock) {
            parsedBlock = ts.factory.createBlock([], true);
          }
          stripPositions(parsedBlock);

          // Build MethodDeclaration node
          const newMethod = ts.factory.createMethodDeclaration(
            undefined,
            undefined,
            ts.factory.createIdentifier(methodName),
            undefined,
            undefined,
            paramNodes,
            undefined,
            parsedBlock
          );

          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...node.members, newMethod]
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedFile = result.transformed[0];
    return this._print(transformedFile);
  }

  /**
   * Updates or inserts a property assignment into an ObjectLiteralExpression inside a targeted variable declarations statement.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} variableName - Target VariableDeclarator name.
   * @param {string} propertyKey - Property key string.
   * @param {any} propertyValue - Primitive property value (string, number, boolean).
   * @returns {string} Modified source file text.
   */
  updateObjectProperty(sourceText, variableName, propertyKey, propertyValue) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
          if (node.initializer && ts.isObjectLiteralExpression(node.initializer)) {
            const objectLiteral = node.initializer;
            
            // Build the new value node
            let valueNode;
            if (typeof propertyValue === 'string') {
              valueNode = ts.factory.createStringLiteral(propertyValue);
            } else if (typeof propertyValue === 'number') {
              valueNode = ts.factory.createNumericLiteral(String(propertyValue));
            } else if (typeof propertyValue === 'boolean') {
              valueNode = propertyValue ? ts.factory.createTrue() : ts.factory.createFalse();
            } else {
              valueNode = ts.factory.createNull();
            }

            // Exists? Update it. Else, append.
            let updatedProperties = [];
            let keyFound = false;

            for (const prop of objectLiteral.properties) {
              if (ts.isPropertyAssignment(prop) && ts.isIdentifier(prop.name) && prop.name.text === propertyKey) {
                updatedProperties.push(ts.factory.updatePropertyAssignment(prop, prop.name, valueNode));
                keyFound = true;
              } else {
                updatedProperties.push(prop);
              }
            }

            if (!keyFound) {
              const newAssignment = ts.factory.createPropertyAssignment(
                ts.factory.createIdentifier(propertyKey),
                valueNode
              );
              updatedProperties.push(newAssignment);
            }

            const updatedInitializer = ts.factory.updateObjectLiteralExpression(objectLiteral, updatedProperties);
            return ts.factory.updateVariableDeclaration(node, node.name, undefined, node.type, updatedInitializer);
          }
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedFile = result.transformed[0];
    return this._print(transformedFile);
  }

  /**
   * Injects a top-level function declaration at the end of the file.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} functionName - Name of function to insert.
   * @param {string[]} parameters - Parameters array e.g., ["req", "res"]
   * @param {string} functionBodyText - Function body statement text block.
   * @param {boolean} [isExported=false] - Whether to add the 'export' modifier.
   * @returns {string} Modified source file text.
   */
  addFunction(sourceText, functionName, parameters, functionBodyText, isExported = false) {
    const sourceFile = this._parse('temp.ts', sourceText);

    // Check if function already exists
    let exists = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isFunctionDeclaration(node) && node.name && node.name.text === functionName) {
        exists = true;
      }
    });

    if (exists) return sourceText;

    // Build parameter nodes
    const paramNodes = parameters.map(p => 
      ts.factory.createParameterDeclaration(
        undefined,
        undefined,
        ts.factory.createIdentifier(p),
        undefined,
        undefined,
        undefined
      )
    );

    // Parse function body block
    const tempSource = ts.createSourceFile('temp_body.ts', `function temp() { ${functionBodyText} }`, ts.ScriptTarget.Latest, true);
    let parsedBlock;
    ts.forEachChild(tempSource, (child) => {
      if (ts.isFunctionDeclaration(child) && child.body) {
        parsedBlock = child.body;
      }
    });

    if (!parsedBlock) {
      parsedBlock = ts.factory.createBlock([], true);
    }
    stripPositions(parsedBlock);

    // Modifiers (export)
    const modifiers = isExported 
      ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)]
      : undefined;

    // Build FunctionDeclaration node
    const newFunc = ts.factory.createFunctionDeclaration(
      modifiers,
      undefined,
      ts.factory.createIdentifier(functionName),
      undefined,
      paramNodes,
      undefined,
      parsedBlock
    );

    const updatedStatements = [...sourceFile.statements, newFunc];
    const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
    return this._print(updatedSourceFile);
  }

  /**
   * Modifies the body block of an existing top-level function.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} functionName - Name of the function to modify.
   * @param {string} functionBodyText - New function body statement text block.
   * @returns {string} Modified source file text.
   */
  modifyFunction(sourceText, functionName, functionBodyText) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isFunctionDeclaration(node) && node.name && node.name.text === functionName) {
          // Parse function body block
          const tempSource = ts.createSourceFile('temp_body.ts', `function temp() { ${functionBodyText} }`, ts.ScriptTarget.Latest, true);
          let parsedBlock;
          ts.forEachChild(tempSource, (child) => {
            if (ts.isFunctionDeclaration(child) && child.body) {
              parsedBlock = child.body;
            }
          });

          if (!parsedBlock) {
            parsedBlock = ts.factory.createBlock([], true);
          }
          stripPositions(parsedBlock);

          const newParams = node.parameters.map(p => 
            ts.factory.createParameterDeclaration(
              undefined,
              undefined,
              ts.factory.createIdentifier(p.name.text),
              undefined,
              undefined,
              undefined
            )
          );

          const newModifiers = node.modifiers
            ? node.modifiers.map(m => ts.factory.createModifier(m.kind))
            : undefined;

          return ts.factory.createFunctionDeclaration(
            newModifiers,
            node.asteriskToken,
            ts.factory.createIdentifier(node.name.text),
            undefined,
            newParams,
            undefined,
            parsedBlock
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedFile = result.transformed[0];
    return this._print(transformedFile);
  }

  /**
   * Updates a simple variable assignment initializer.
   *
   * @param {string} sourceText - Original source file text.
   * @param {string} variableName - Target VariableDeclaration name.
   * @param {any} value - Value to assign (string, number, boolean).
   * @returns {string} Modified source file text.
   */
  updateVariableAssignment(sourceText, variableName, value) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.name.text === variableName) {
          let valueNode;
          if (typeof value === 'string') {
            valueNode = ts.factory.createStringLiteral(value);
          } else if (typeof value === 'number') {
            valueNode = ts.factory.createNumericLiteral(String(value));
          } else if (typeof value === 'boolean') {
            valueNode = value ? ts.factory.createTrue() : ts.factory.createFalse();
          } else {
            valueNode = ts.factory.createNull();
          }

          return ts.factory.updateVariableDeclaration(
            node,
            node.name,
            undefined,
            node.type,
            valueNode
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    const transformedFile = result.transformed[0];
    return this._print(transformedFile);
  }

  /**
   * Applies a sequential list of AST transformations to a source file text.
   *
   * @param {string} sourceText - Original source file text.
   * @param {Array<object>} transforms - Array of transform objects containing 'type' and params.
   * @returns {string} Modified source file text.
   */
  applyTransformations(sourceText, transforms) {
    let currentText = sourceText;
    for (const t of transforms) {
      switch (t.type) {
        case 'addImport':
          currentText = this.addImport(currentText, t.importSpecifier, t.moduleSpecifier);
          break;
        case 'addMethod':
          currentText = this.addMethod(currentText, t.className, t.methodName, t.parameters, t.methodBodyText);
          break;
        case 'updateObjectProperty':
          currentText = this.updateObjectProperty(currentText, t.variableName, t.propertyKey, t.propertyValue);
          break;
        case 'addFunction':
          currentText = this.addFunction(currentText, t.functionName, t.parameters, t.functionBodyText, t.isExported);
          break;
        case 'modifyFunction':
          currentText = this.modifyFunction(currentText, t.functionName, t.functionBodyText);
          break;
        case 'updateVariableAssignment':
          currentText = this.updateVariableAssignment(currentText, t.variableName, t.value);
          break;
        default:
          throw new Error(`Unknown AST transformation type: ${t.type}`);
      }
    }
    return currentText;
  }
}

module.exports = new ASTTransformEngine();
