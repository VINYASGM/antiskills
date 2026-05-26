const ts = require('typescript');
const fs = require('node:fs');

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
            return ts.factory.updateVariableDeclaration(node, node.name, node.type, updatedInitializer);
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
}

module.exports = new ASTTransformEngine();
