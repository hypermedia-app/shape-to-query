import { NamedNode, Variable } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { sh, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import { fromNode } from 'clownface-shacl-path'
import PathVisitor from './PathVisitor'
import { createVariableSequence, VariableSequence } from './variableSequence'
import { ShapePatterns } from './types'
import targets from './targets'

export interface Options {
  subjectVariable?: string
  focusNode?: NamedNode
  objectVariablePrefix?: string
}

type PropertyShapeOptions = Pick<Options, 'objectVariablePrefix'>

const TRUE = $rdf.literal('true', xsd.boolean)

export function shapeToPatterns(shape: GraphPointer, options: Options): ShapePatterns {
  const prefix = options.subjectVariable || 'resource'
  const variable = createVariableSequence(prefix)
  let focusNode = options.focusNode || variable()

  let target: ShapePatterns = {
    constructClause: '',
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

  return {
    constructClause: sparql`
      ${target.constructClause}
      ${visitor.constructPatterns}
    `,
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
    const [term, patterns] = targetPatternMap.shift()
    if (term.equals(sh.targetNode)) {
      return <NamedNode>shape.out(sh.targetNode).term
    }

    return patterns
  }

  const targetPatterns = targetPatternMap.map(([, p]) => p)
  const constructClause = targetPatterns
    .map(({ constructClause }) => constructClause)
    .reduce((previousValue, currentValue) => sparql`${previousValue}\n${currentValue}`)
  const whereClause = sparql`${toUnion(targetPatterns.map(({ whereClause }) => [whereClause]))}`
  return {
    constructClause,
    whereClause,
  }
}

function toUnion(propertyPatterns: (string | SparqlTemplateResult)[][]) {
  if (propertyPatterns.length > 1) {
    return propertyPatterns.reduce((union, next, index) => {
      if (index === 0) {
        return sparql`{ ${next} }`
      }

      return sparql`${union}
      UNION
      { ${next} }`
    }, sparql``)
  }

  return propertyPatterns
}

interface PropertyShapePatterns {
  shape: GraphPointer
  focusNode: NamedNode | Variable
  options: PropertyShapeOptions
  parentPatterns?: SparqlTemplateResult[]
  visitor: PathVisitor
  variable: VariableSequence
}

function * deepPropertyShapePatterns({ shape, focusNode, options, visitor, variable, parentPatterns = [] }: PropertyShapePatterns): Generator<SparqlTemplateResult[]> {
  const activeProperties = shape.out(sh.property)
    .filter(propShape => !propShape.has(sh.deactivated, TRUE).term)
    .toArray()

  for (const propShape of activeProperties) {
    const path = propShape.out(sh.path)

    const pathEnd = variable()
    const selfPatterns = visitor.visit(fromNode(path), {
      pathStart: focusNode,
      pathEnd,
    })

    const combinedPatterns = [...parentPatterns, selfPatterns]

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
