import { Term, NamedNode, Variable, BaseQuad } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import type { MultiPointer } from 'clownface'
import { quad } from '@rdfjs/data-model'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import { ShapePatterns } from './shapePatterns'
import { VariableSequence } from './variableSequence'

interface GetNodeExpressionPatterns {
  focusNode: Variable | NamedNode
  variable: VariableSequence
  shape: MultiPointer
  pathEnd: Term
}

export function getNodeExpressionPatterns({ focusNode, shape, pathEnd }: GetNodeExpressionPatterns): ShapePatterns {
  const nodeExpressions = shape.out(sh.values)
  const path = shape.out(sh.path)

  const evaluatedExpressions = nodeExpressions.map(nodeExpression => {
    return sparql`BIND(${nodeExpression.term} as ${pathEnd})`
  })

  return {
    whereClause: sparql`${UNION(...evaluatedExpressions)}`,
    constructClause: [quad<BaseQuad>(focusNode, path.term, pathEnd)],
  }
}
