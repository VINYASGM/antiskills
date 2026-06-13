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
 * Helper to recursively extract the tag name text from a JSX tag name node (e.g. Form.Item or div).
 */
function getTagNameText(tagNameNode) {
  if (!tagNameNode) return '';
  if (ts.isIdentifier(tagNameNode)) return tagNameNode.text;
  if (ts.isPropertyAccessExpression(tagNameNode)) {
    return `${getTagNameText(tagNameNode.expression)}.${tagNameNode.name.text}`;
  }
  return '';
}

/**
 * Helper to serialize a complex or primitive value into a TypeScript AST node.
 */
function serializeValueToAST(value) {
  if (value === null || value === undefined) {
    return ts.factory.createNull();
  }
  if (typeof value === 'string') {
    return ts.factory.createStringLiteral(value);
  }
  if (typeof value === 'number') {
    return ts.factory.createNumericLiteral(String(value));
  }
  if (typeof value === 'boolean') {
    return value ? ts.factory.createTrue() : ts.factory.createFalse();
  }
  if (typeof value === 'object') {
    const jsonStr = JSON.stringify(value);
    const tempSource = ts.createSourceFile('temp_val.ts', `const temp = ${jsonStr};`, ts.ScriptTarget.Latest, true);
    let parsedExpr;
    ts.forEachChild(tempSource, (child) => {
      if (ts.isVariableStatement(child)) {
        const decl = child.declarationList.declarations[0];
        if (decl && decl.initializer) parsedExpr = decl.initializer;
      }
    });
    if (parsedExpr) {
      stripPositions(parsedExpr);
      return parsedExpr;
    }
  }
  return ts.factory.createNull();
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
      ts.ScriptKind.TSX
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

    // Parse the new import specifier
    const isNamed = importSpecifier.startsWith('{') && importSpecifier.endsWith('}');
    let newNames = [];
    let newDefault = null;
    if (isNamed) {
      newNames = importSpecifier.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean);
    } else {
      newDefault = importSpecifier.trim();
    }

    // Helper functions for checking covering and mergeability
    const isFullyCovered = (node) => {
      if (!node.importClause) return false;
      if (isNamed) {
        if (node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
          const existingNames = node.importClause.namedBindings.elements.map(el => el.name.text);
          return newNames.every(name => existingNames.includes(name));
        }
        return false;
      } else {
        return node.importClause.name && node.importClause.name.text === newDefault;
      }
    };

    const canMerge = (node) => {
      if (!node.importClause) {
        return true;
      }
      if (isNamed) {
        if (node.importClause.namedBindings && ts.isNamespaceImport(node.importClause.namedBindings)) {
          return false;
        }
        return true;
      } else {
        if (node.importClause.name) {
          return node.importClause.name.text === newDefault;
        }
        return true;
      }
    };

    // Scan all existing import declarations with matching module specifier
    const matchingImports = [];
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isImportDeclaration(node)) {
        if (ts.isStringLiteral(node.moduleSpecifier) && node.moduleSpecifier.text === moduleSpecifier) {
          matchingImports.push(node);
        }
      }
    });

    if (matchingImports.length > 0) {
      // 1. If any matching import fully covers the new import, do nothing
      if (matchingImports.some(isFullyCovered)) {
        return sourceText;
      }

      // 2. Find the first matching import that can be merged
      const targetNodeToMerge = matchingImports.find(canMerge);
      if (targetNodeToMerge) {
        const transformer = (context) => {
          const visit = (node) => {
            if (node === targetNodeToMerge) {
              let newImportClause;
              if (isNamed) {
                const elements = [];
                if (node.importClause && node.importClause.namedBindings && ts.isNamedImports(node.importClause.namedBindings)) {
                  elements.push(...node.importClause.namedBindings.elements);
                }
                const existingNames = elements.map(el => el.name.text);
                const missingNames = newNames.filter(name => !existingNames.includes(name));
                for (const name of missingNames) {
                  elements.push(
                    ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
                  );
                }
                const namedBindings = ts.factory.createNamedImports(elements);
                const defaultName = node.importClause ? node.importClause.name : undefined;
                newImportClause = ts.factory.createImportClause(false, defaultName, namedBindings);
              } else {
                const defaultName = ts.factory.createIdentifier(newDefault);
                const namedBindings = node.importClause ? node.importClause.namedBindings : undefined;
                newImportClause = ts.factory.createImportClause(false, defaultName, namedBindings);
              }
              const updatedImport = ts.factory.createImportDeclaration(
                undefined,
                newImportClause,
                node.moduleSpecifier,
                undefined
              );
              stripPositions(updatedImport);
              return updatedImport;
            }
            return ts.visitEachChild(node, visit, context);
          };
          return (rootNode) => ts.visitNode(rootNode, visit);
        };

        const result = ts.transform(sourceFile, [transformer]);
        return this._print(result.transformed[0]);
      }
    }

    // 3. Fallback: Create and prepend a new import declaration
    let importClause;
    if (isNamed) {
      const elements = newNames.map(name =>
        ts.factory.createImportSpecifier(false, undefined, ts.factory.createIdentifier(name))
      );
      importClause = ts.factory.createImportClause(
        false,
        undefined,
        ts.factory.createNamedImports(elements)
      );
    } else {
      importClause = ts.factory.createImportClause(
        false,
        ts.factory.createIdentifier(newDefault),
        undefined
      );
    }

    const newImport = ts.factory.createImportDeclaration(
      undefined,
      importClause,
      ts.factory.createStringLiteral(moduleSpecifier),
      undefined
    );

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
            const valueNode = serializeValueToAST(propertyValue);

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
          const valueNode = serializeValueToAST(value);

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
   * Adds a new ClassDeclaration if it doesn't already exist.
   *
   * @param {string} sourceText
   * @param {string} className
   * @param {boolean} [isExported=false]
   * @returns {string}
   */
  addClass(sourceText, className, isExported = false) {
    const sourceFile = this._parse('temp.ts', sourceText);
    
    let exists = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isClassDeclaration(node) && node.name && node.name.text === className) {
        exists = true;
      }
    });
    if (exists) return sourceText;

    const modifiers = isExported 
      ? [ts.factory.createModifier(ts.SyntaxKind.ExportKeyword)]
      : undefined;

    const newClass = ts.factory.createClassDeclaration(
      modifiers,
      ts.factory.createIdentifier(className),
      undefined, // typeParameters
      undefined, // heritageClauses
      []         // members
    );
    stripPositions(newClass);

    const updatedStatements = [...sourceFile.statements, newClass];
    const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
    return this._print(updatedSourceFile);
  }

  /**
   * Adds a decorator to an existing ClassDeclaration.
   *
   * @param {string} sourceText
   * @param {string} className
   * @param {string} decoratorName
   * @param {any[]} [decoratorArgs=undefined]
   * @returns {string}
   */
  addClassDecorator(sourceText, className, decoratorName, decoratorArgs = undefined) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isClassDeclaration(node) && node.name && node.name.text === className) {
          // Construct decorator call expression
          let expression = ts.factory.createIdentifier(decoratorName);
          if (decoratorArgs !== undefined) {
            const argNodes = decoratorArgs.map(arg => serializeValueToAST(arg));
            expression = ts.factory.createCallExpression(expression, undefined, argNodes);
          }
          const newDecorator = ts.factory.createDecorator(expression);
          stripPositions(newDecorator);

          // Avoid duplicates
          const hasDecorator = node.modifiers?.some(mod => {
            if (ts.isDecorator(mod)) {
              const expr = mod.expression;
              if (ts.isIdentifier(expr) && expr.text === decoratorName) return true;
              if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === decoratorName) return true;
            }
            return false;
          });
          if (hasDecorator) return node;

          const updatedModifiers = [newDecorator, ...(node.modifiers || [])];
          return ts.factory.updateClassDeclaration(
            node,
            updatedModifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            node.members
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }

  /**
   * Adds or updates a method in a targeted ClassDeclaration.
   */
  addClassMethod(sourceText, className, methodName, parameters, methodBodyText, decorators = [], modifiers = []) {
    const sourceFile = this._parse('temp.ts', sourceText);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isClassDeclaration(node) && node.name && node.name.text === className) {
          // Build parameters
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

          // Parse body
          const tempSource = ts.createSourceFile('temp_body.ts', `function temp() { ${methodBodyText} }`, ts.ScriptTarget.Latest, true);
          let parsedBlock;
          ts.forEachChild(tempSource, (child) => {
            if (ts.isFunctionDeclaration(child) && child.body) parsedBlock = child.body;
          });
          if (!parsedBlock) parsedBlock = ts.factory.createBlock([], true);
          stripPositions(parsedBlock);

          // Build decorators
          const decoratorNodes = decorators.map(dec => {
            let expr = ts.factory.createIdentifier(dec.name);
            if (dec.args !== undefined) {
              const argNodes = dec.args.map(arg => serializeValueToAST(arg));
              expr = ts.factory.createCallExpression(expr, undefined, argNodes);
            }
            const decoratorNode = ts.factory.createDecorator(expr);
            stripPositions(decoratorNode);
            return decoratorNode;
          });

          // Build modifiers
          const modifierNodes = modifiers.map(m => {
            if (m === 'public') return ts.factory.createModifier(ts.SyntaxKind.PublicKeyword);
            if (m === 'private') return ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword);
            if (m === 'protected') return ts.factory.createModifier(ts.SyntaxKind.ProtectedKeyword);
            if (m === 'static') return ts.factory.createModifier(ts.SyntaxKind.StaticKeyword);
            if (m === 'async') return ts.factory.createModifier(ts.SyntaxKind.AsyncKeyword);
          }).filter(Boolean);

          const allModifiers = [...decoratorNodes, ...modifierNodes];

          const newMethod = ts.factory.createMethodDeclaration(
            allModifiers.length > 0 ? allModifiers : undefined,
            undefined,
            ts.factory.createIdentifier(methodName),
            undefined,
            undefined,
            paramNodes,
            undefined,
            parsedBlock
          );

          const filteredMembers = node.members.filter(member => 
            !(ts.isMethodDeclaration(member) && ts.isIdentifier(member.name) && member.name.text === methodName)
          );

          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...filteredMembers, newMethod]
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }

  /**
   * Adds or updates a property in a targeted ClassDeclaration.
   */
  addClassProperty(sourceText, className, propertyName, propertyType, initializerText, decorators = [], modifiers = []) {
    const sourceFile = this._parse('temp.ts', sourceText);

    // Parse the type signature from string if provided
    let parsedTypeNode;
    if (propertyType) {
      const tempSource = ts.createSourceFile('temp_type.ts', `type Temp = ${propertyType};`, ts.ScriptTarget.Latest, true);
      ts.forEachChild(tempSource, (child) => {
        if (ts.isTypeAliasDeclaration(child)) {
          parsedTypeNode = child.type;
        }
      });
      if (parsedTypeNode) {
        stripPositions(parsedTypeNode);
      }
    }

    // Parse the initializer expression if provided
    let initializerNode;
    if (initializerText) {
      const tempSource = ts.createSourceFile('temp_init.ts', `const temp = ${initializerText};`, ts.ScriptTarget.Latest, true);
      ts.forEachChild(tempSource, (child) => {
        if (ts.isVariableStatement(child)) {
          const decl = child.declarationList.declarations[0];
          if (decl && decl.initializer) {
            initializerNode = decl.initializer;
          }
        }
      });
      if (initializerNode) {
        stripPositions(initializerNode);
      }
    }

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isClassDeclaration(node) && node.name && node.name.text === className) {
          // Build decorators
          const decoratorNodes = decorators.map(dec => {
            let expr = ts.factory.createIdentifier(dec.name);
            if (dec.args !== undefined) {
              const argNodes = dec.args.map(arg => serializeValueToAST(arg));
              expr = ts.factory.createCallExpression(expr, undefined, argNodes);
            }
            const decoratorNode = ts.factory.createDecorator(expr);
            stripPositions(decoratorNode);
            return decoratorNode;
          });

          // Build modifiers
          const modifierNodes = modifiers.map(m => {
            if (m === 'public') return ts.factory.createModifier(ts.SyntaxKind.PublicKeyword);
            if (m === 'private') return ts.factory.createModifier(ts.SyntaxKind.PrivateKeyword);
            if (m === 'protected') return ts.factory.createModifier(ts.SyntaxKind.ProtectedKeyword);
            if (m === 'static') return ts.factory.createModifier(ts.SyntaxKind.StaticKeyword);
          }).filter(Boolean);

          const allModifiers = [...decoratorNodes, ...modifierNodes];

          const newProperty = ts.factory.createPropertyDeclaration(
            allModifiers.length > 0 ? allModifiers : undefined,
            ts.factory.createIdentifier(propertyName),
            undefined, // questionOrExclamationToken
            parsedTypeNode,
            initializerNode
          );

          const filteredMembers = node.members.filter(member => 
            !(ts.isPropertyDeclaration(member) && ts.isIdentifier(member.name) && member.name.text === propertyName)
          );

          return ts.factory.updateClassDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...filteredMembers, newProperty]
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }

  /**
   * Appends a JSX element inside target JSX containers.
   *
   * @param {string} sourceText
   * @param {{tagName?: string, attributeName?: string, attributeValue?: string}} targetSelector
   * @param {string} jsxString
   */
  addJsxElement(sourceText, targetSelector, jsxString) {
    if (!targetSelector || (!targetSelector.tagName && !targetSelector.attributeName)) {
      return sourceText;
    }
    const sourceFile = this._parse('temp.tsx', sourceText);

    // Parse the JSX string
    const tempSource = ts.createSourceFile('temp_jsx.tsx', `const temp = ${jsxString};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
    let jsxNode;
    ts.forEachChild(tempSource, (child) => {
      if (ts.isVariableStatement(child)) {
        const decl = child.declarationList.declarations[0];
        if (decl && decl.initializer) jsxNode = decl.initializer;
      }
    });
    if (!jsxNode) throw new Error("Invalid JSX string.");
    stripPositions(jsxNode);

    // Select matching elements helper
    const matchSelector = (node) => {
      if (!node) return false;
      if (!targetSelector || (!targetSelector.tagName && !targetSelector.attributeName)) return false;
      const tagNameText = getTagNameText(node.tagName);
      if (targetSelector.tagName && tagNameText !== targetSelector.tagName) return false;
      if (targetSelector.attributeName) {
        const properties = node.attributes?.properties || [];
        return properties.some(attr => {
          if (ts.isJsxAttribute(attr) && attr.name.text === targetSelector.attributeName) {
            if (targetSelector.attributeValue) {
              const val = attr.initializer ? (
                ts.isStringLiteral(attr.initializer) ? attr.initializer.text : 
                (ts.isJsxExpression(attr.initializer) && attr.initializer.expression && ts.isStringLiteral(attr.initializer.expression) ? attr.initializer.expression.text : null)
              ) : null;
              return val === targetSelector.attributeValue;
            }
            return true;
          }
          return false;
        });
      }
      return true;
    };

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isJsxElement(node) && matchSelector(node.openingElement)) {
          const updatedChildren = [...node.children, jsxNode];
          return ts.factory.updateJsxElement(
            node,
            node.openingElement,
            updatedChildren,
            node.closingElement
          );
        }

        // Convert self-closing element if it's the target
        if (ts.isJsxSelfClosingElement(node) && matchSelector(node)) {
          const opening = ts.factory.createJsxOpeningElement(node.tagName, node.typeArguments, node.attributes);
          const closing = ts.factory.createJsxClosingElement(node.tagName);
          return ts.factory.createJsxElement(opening, [jsxNode], closing);
        }

        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }

  /**
   * Adds or replaces an attribute on a targeted JSX element.
   *
   * @param {string} sourceText
   * @param {{tagName?: string}} targetSelector
   * @param {string} attrName
   * @param {string} attrValueExpression - e.g. "my-class" or "{handleClick}"
   */
  updateJsxAttribute(sourceText, targetSelector, attrName, attrValueExpression) {
    if (!targetSelector || (!targetSelector.tagName && !targetSelector.attributeName)) {
      return sourceText;
    }
    const sourceFile = this._parse('temp.tsx', sourceText);

    // Parse attribute values
    let initializer;
    if (typeof attrValueExpression === 'string' && !attrValueExpression.startsWith('{')) {
      initializer = ts.factory.createStringLiteral(attrValueExpression);
    } else {
      const rawExpr = attrValueExpression.startsWith('{') && attrValueExpression.endsWith('}') 
        ? attrValueExpression.slice(1, -1) 
        : attrValueExpression;
      
      const tempSource = ts.createSourceFile('temp_expr.tsx', `const temp = ${rawExpr};`, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
      let parsedExpr;
      ts.forEachChild(tempSource, (child) => {
        if (ts.isVariableStatement(child)) {
          const decl = child.declarationList.declarations[0];
          if (decl && decl.initializer) parsedExpr = decl.initializer;
        }
      });
      if (!parsedExpr) parsedExpr = ts.factory.createNull();
      stripPositions(parsedExpr);
      initializer = ts.factory.createJsxExpression(undefined, parsedExpr);
    }

    const newAttr = ts.factory.createJsxAttribute(ts.factory.createIdentifier(attrName), initializer);

    const matchSelector = (node) => {
      if (!node) return false;
      if (!targetSelector || (!targetSelector.tagName && !targetSelector.attributeName)) return false;
      
      const tagNameText = getTagNameText(node.tagName);
      if (targetSelector.tagName && tagNameText !== targetSelector.tagName) return false;
      
      if (targetSelector.attributeName) {
        const attributes = node.attributes?.properties || [];
        return attributes.some(attr => {
          if (ts.isJsxAttribute(attr) && attr.name.text === targetSelector.attributeName) {
            if (targetSelector.attributeValue) {
              const val = attr.initializer ? (
                ts.isStringLiteral(attr.initializer) ? attr.initializer.text : 
                (ts.isJsxExpression(attr.initializer) && attr.initializer.expression && ts.isStringLiteral(attr.initializer.expression) ? attr.initializer.expression.text : null)
              ) : null;
              return val === targetSelector.attributeValue;
            }
            return true;
          }
          return false;
        });
      }
      return true;
    };

    const transformer = (context) => {
      const visit = (node) => {
        let match = false;
        if (ts.isJsxElement(node)) {
          match = matchSelector(node.openingElement);
        } else if (ts.isJsxSelfClosingElement(node)) {
          match = matchSelector(node);
        }

        if (match) {
          const attributes = ts.isJsxElement(node) ? node.openingElement.attributes : node.attributes;
          let updatedProps = [];
          let found = false;
          for (const prop of attributes.properties) {
            if (ts.isJsxAttribute(prop) && prop.name.text === attrName) {
              updatedProps.push(ts.factory.updateJsxAttribute(prop, prop.name, initializer));
              found = true;
            } else {
              updatedProps.push(prop);
            }
          }
          if (!found) updatedProps.push(newAttr);
          const updatedAttributes = ts.factory.createJsxAttributes(updatedProps);

          if (ts.isJsxElement(node)) {
            const updatedOpening = ts.factory.updateJsxOpeningElement(
              node.openingElement,
              node.openingElement.tagName,
              node.openingElement.typeArguments,
              updatedAttributes
            );
            return ts.factory.updateJsxElement(node, updatedOpening, node.children, node.closingElement);
          } else {
            return ts.factory.updateJsxSelfClosingElement(
              node,
              node.tagName,
              node.typeArguments,
              updatedAttributes
            );
          }
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }



  /**
   * Adds a new InterfaceDeclaration if it doesn't already exist.
   *
   * @param {string} sourceText
   * @param {string} interfaceName
   * @param {string[]} [extendsNames=[]]
   * @returns {string}
   */
  addInterface(sourceText, interfaceName, extendsNames = []) {
    const sourceFile = this._parse('temp.ts', sourceText);

    let exists = false;
    ts.forEachChild(sourceFile, (node) => {
      if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
        exists = true;
      }
    });
    if (exists) return sourceText;

    // Build heritage clauses (extends list)
    let heritageClauses;
    if (extendsNames.length > 0) {
      const types = extendsNames.map(name => 
        ts.factory.createExpressionWithTypeArguments(
          ts.factory.createIdentifier(name),
          undefined
        )
      );
      heritageClauses = [
        ts.factory.createHeritageClause(
          ts.SyntaxKind.ExtendsKeyword,
          types
        )
      ];
    }

    const newInterface = ts.factory.createInterfaceDeclaration(
      undefined, // modifiers
      ts.factory.createIdentifier(interfaceName),
      undefined, // typeParameters
      heritageClauses,
      []         // members
    );
    stripPositions(newInterface);

    const updatedStatements = [...sourceFile.statements, newInterface];
    const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
    return this._print(updatedSourceFile);
  }

  /**
   * Adds or updates a property in a targeted InterfaceDeclaration.
   *
   * @param {string} sourceText
   * @param {string} interfaceName
   * @param {string} propertyName
   * @param {boolean} isOptional
   * @param {string} propertyType
   * @returns {string}
   */
  addInterfaceProperty(sourceText, interfaceName, propertyName, isOptional, propertyType) {
    const sourceFile = this._parse('temp.ts', sourceText);

    // Parse the type signature from string
    const tempSource = ts.createSourceFile('temp_type.ts', `type Temp = ${propertyType};`, ts.ScriptTarget.Latest, true);
    let parsedTypeNode;
    ts.forEachChild(tempSource, (child) => {
      if (ts.isTypeAliasDeclaration(child)) {
        parsedTypeNode = child.type;
      }
    });
    if (!parsedTypeNode) parsedTypeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    stripPositions(parsedTypeNode);

    const questionToken = isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionToken) : undefined;

    const newProperty = ts.factory.createPropertySignature(
      undefined, // modifiers
      ts.factory.createIdentifier(propertyName),
      questionToken,
      parsedTypeNode
    );
    stripPositions(newProperty);

    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isInterfaceDeclaration(node) && node.name.text === interfaceName) {
          // Filter out existing property signature with same name to support updates
          const filteredMembers = node.members.filter(member => 
            !(ts.isPropertySignature(member) && ts.isIdentifier(member.name) && member.name.text === propertyName)
          );

          return ts.factory.updateInterfaceDeclaration(
            node,
            node.modifiers,
            node.name,
            node.typeParameters,
            node.heritageClauses,
            [...filteredMembers, newProperty]
          );
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    return this._print(result.transformed[0]);
  }

  /**
   * Adds a new TypeAliasDeclaration or updates an existing one.
   *
   * @param {string} sourceText
   * @param {string} typeName
   * @param {string} typeValueText
   * @returns {string}
   */
  addTypeAlias(sourceText, typeName, typeValueText) {
    const sourceFile = this._parse('temp.ts', sourceText);

    // Parse typeValueText into a TypeNode
    const tempSource = ts.createSourceFile('temp_type.ts', `type Temp = ${typeValueText};`, ts.ScriptTarget.Latest, true);
    let parsedTypeNode;
    ts.forEachChild(tempSource, (child) => {
      if (ts.isTypeAliasDeclaration(child)) {
        parsedTypeNode = child.type;
      }
    });
    if (!parsedTypeNode) parsedTypeNode = ts.factory.createKeywordTypeNode(ts.SyntaxKind.AnyKeyword);
    stripPositions(parsedTypeNode);

    const newTypeAlias = ts.factory.createTypeAliasDeclaration(
      undefined, // modifiers
      ts.factory.createIdentifier(typeName),
      undefined, // typeParameters
      parsedTypeNode
    );
    stripPositions(newTypeAlias);

    let exists = false;
    const transformer = (context) => {
      const visit = (node) => {
        if (ts.isTypeAliasDeclaration(node) && node.name.text === typeName) {
          exists = true;
          return newTypeAlias;
        }
        return ts.visitEachChild(node, visit, context);
      };
      return (rootNode) => ts.visitNode(rootNode, visit);
    };

    const result = ts.transform(sourceFile, [transformer]);
    
    if (exists) {
      return this._print(result.transformed[0]);
    } else {
      // Append if it doesn't exist
      const updatedStatements = [...sourceFile.statements, newTypeAlias];
      const updatedSourceFile = ts.factory.updateSourceFile(sourceFile, updatedStatements);
      return this._print(updatedSourceFile);
    }
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
        case 'addClass':
          currentText = this.addClass(currentText, t.className, t.isExported);
          break;
        case 'addClassDecorator':
          currentText = this.addClassDecorator(currentText, t.className, t.decoratorName, t.decoratorArgs);
          break;
        case 'addClassMethod':
          currentText = this.addClassMethod(currentText, t.className, t.methodName, t.parameters, t.methodBodyText, t.decorators, t.modifiers);
          break;
        case 'addClassProperty':
          currentText = this.addClassProperty(currentText, t.className, t.propertyName, t.propertyType, t.initializerText, t.decorators, t.modifiers);
          break;
        case 'addJsxElement':
          currentText = this.addJsxElement(currentText, t.targetSelector, t.jsxString);
          break;
        case 'updateJsxAttribute':
          currentText = this.updateJsxAttribute(currentText, t.targetSelector, t.attrName, t.attrValueExpression);
          break;
        case 'addInterface':
          currentText = this.addInterface(currentText, t.interfaceName, t.extendsNames);
          break;
        case 'addInterfaceProperty':
          currentText = this.addInterfaceProperty(currentText, t.interfaceName, t.propertyName, t.isOptional, t.propertyType);
          break;
        case 'addTypeAlias':
          currentText = this.addTypeAlias(currentText, t.typeName, t.typeValueText);
          break;
        default:
          throw new Error(`Unknown AST transformation type: ${t.type}`);
      }
    }
    return currentText;
  }
}

module.exports = new ASTTransformEngine();
