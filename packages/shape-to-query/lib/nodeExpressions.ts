import { Term, NamedNode, Variable, BaseQuad } from 'rdf-js'
import { sparql } from '@tpluscode/sparql-builder'
import { VALUES } from '@tpluscode/sparql-builder/expressions'
import type { MultiPointer } from 'clownface'
import { quad } from '@rdfjs/data-model'
import { ShapePatterns } from './shapePatterns'
import { VariableSequence } from './variableSequence'

interface GetNodeExpressionPatterns {
  focusNode: Variable | NamedNode
  variable: VariableSequence
  nodeExpression: MultiPointer
  path: MultiPointer
  pathEnd: Term
}

export function getNodeExpressionPatterns({ focusNode, variable, nodeExpression, path, pathEnd }: GetNodeExpressionPatterns): ShapePatterns {
  const constantTermVar = variable()
  const constantTermExpressionValues = nodeExpression.terms
    .map(term => ({ [constantTermVar.value]: term }))
  const whereClause = sparql`
        ${VALUES(...constantTermExpressionValues)}
        BIND (${constantTermVar} as ${pathEnd})
      `

  return {
    whereClause,
    constructClause: [quad<BaseQuad>(focusNode, path.term, pathEnd)],
  }
}
