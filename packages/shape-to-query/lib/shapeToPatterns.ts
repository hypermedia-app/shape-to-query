import { NamedNode, Variable } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql } from '@tpluscode/sparql-builder'
import { xsd } from '@tpluscode/rdf-ns-builders'
import { sh } from '@tpluscode/rdf-ns-builders/loose'
import $rdf from '@rdfjs/data-model'
import { fromNode } from 'clownface-shacl-path'
import { isNamedNode } from 'is-graph-pointer'
import PathVisitor from './PathVisitor'
import { createVariableSequence, VariableSequence } from './variableSequence'
import { emptyPatterns, ShapePatterns, toUnion, unique } from './shapePatterns'
import targets from './targets'
import { getNodeExpressionPatterns } from './nodeExpressions'

export interface Options {
  subjectVariable?: string
  focusNode?: NamedNode
  objectVariablePrefix?: string
}

type PropertyShapeOptions = Pick<Options, 'objectVariablePrefix'>

const TRUE = $rdf.literal('true', xsd.boolean)

export function shapeToPatterns(shape: GraphPointer, options: Options = {}): ShapePatterns {
  const prefix = options.subjectVariable || 'resource'
  const variable = createVariableSequence(prefix)
  let focusNode = options.focusNode || variable()

  let target: ShapePatterns = {
    constructClause: [],
    whereClause: '',
  }

  if (focusNode.termType === 'Variable') {
    const result = targetPatterns(shape, focusNode, variable)
    if (result) {
      if ('termType' in result) {
        focusNode = result
      } else if (result) {
        target = result
      }
    }
  }
  const visitor = new PathVisitor(variable)
  const resourcePatterns = [...deepPropertyShapePatterns({
    shape,
    focusNode,
    options,
    visitor,
    variable,
  })]

  const constructClause = unique(
    target.constructClause,
    ...resourcePatterns.map(p => p.constructClause),
  )

  return {
    constructClause,
    whereClause: sparql`
      ${target.whereClause}
      ${toUnion(resourcePatterns)}
    `,
  }
}

function targetPatterns(shape: GraphPointer, focusNode: Variable, variable: VariableSequence): ShapePatterns | NamedNode | null {
  const targetPatternMap = [...targets].map(([term, target]) => [term, target({
    shape, focusNode, variable,
  })]).filter((arg): arg is [NamedNode, ShapePatterns] => {
    return 'whereClause' in arg[1]
  })

  if (targetPatternMap.length === 0) {
    return null
  }

  if (targetPatternMap.length === 1) {
    const targetNode = shape.out(sh.targetNode)
    if (isNamedNode(targetNode)) {
      return targetNode.term
    }

    return targetPatternMap.shift()[1]
  }

  const targetPatterns = targetPatternMap.map(([, p]) => p)
  const constructClause = targetPatterns
    .flatMap(({ constructClause }) => constructClause)
  const whereClause = sparql`${toUnion(targetPatterns)}`
  return {
    constructClause,
    whereClause,
  }
}

interface PropertyShapePatterns {
  shape: GraphPointer
  focusNode: NamedNode | Variable
  options: PropertyShapeOptions
  parentPatterns?: ShapePatterns
  visitor: PathVisitor
  variable: VariableSequence
}

function * deepPropertyShapePatterns({ shape, focusNode, options, visitor, variable, parentPatterns = emptyPatterns }: PropertyShapePatterns): Generator<ShapePatterns> {
  const activeProperties = shape.out(sh.property)
    .filter(propShape => !propShape.has(sh.deactivated, TRUE).term)
    .toArray()

  for (const propShape of activeProperties) {
    const path = propShape.out(sh.path)

    const pathEnd = variable()
    const nodeExpression = propShape.out(sh.values)
    let patterns: ShapePatterns
    if (nodeExpression.terms.length) {
      patterns = getNodeExpressionPatterns({
        focusNode,
        variable,
        shape: propShape,
        pathEnd,
      })
    } else {
      patterns = visitor.visit(fromNode(path), {
        pathStart: focusNode,
        pathEnd,
      })
    }

    const combinedPatterns: ShapePatterns = {
      whereClause: sparql`${parentPatterns.whereClause}\n${patterns.whereClause}`,
      constructClause: [...parentPatterns.constructClause, ...patterns.constructClause],
    }

    yield combinedPatterns

    const shNodes = propShape.out(sh.node).toArray()
    for (const shNode of shNodes) {
      const deepPatterns = deepPropertyShapePatterns({
        shape: shNode,
        focusNode: pathEnd,
        options,
        parentPatterns: combinedPatterns,
        visitor,
        variable,
      })
      for (const deepPattern of deepPatterns) {
        yield deepPattern
      }
    }
  }
}
