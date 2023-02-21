import { BaseQuad, NamedNode, Term, Variable } from 'rdf-js'
import type { GraphPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/sparql-builder'
import { rdf, sh, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import { IN } from '@tpluscode/sparql-builder/expressions'
import { isNamedNode } from 'is-graph-pointer'
import { fromNode } from 'clownface-shacl-path'
import PathVisitor from './PathVisitor'
import { createVariableSequence, VariableSequence } from './variableSequence'

export interface Options {
  subjectVariable?: string
  focusNode?: NamedNode
  objectVariablePrefix?: string
}

type PropertyShapeOptions = Pick<Options, 'objectVariablePrefix'>

const TRUE = $rdf.literal('true', xsd.boolean)

interface ShapePatterns {
  whereClause(): SparqlTemplateResult
  constructClause(): SparqlTemplateResult
}

export function shapeToPatterns(shape: GraphPointer, options: Options): ShapePatterns {
  const prefix = options.subjectVariable || 'resource'
  const variable = createVariableSequence(prefix)
  const focusNode = options.focusNode || variable()

  const { targetClassPattern, targetClassFilter } = targetClass(shape, focusNode, prefix)
  const visitor = new PathVisitor(variable)
  const resourcePatterns = [...deepPropertyShapePatterns({
    shape,
    focusNode,
    options,
    visitor,
    variable,
  })]

  return {
    constructClause() {
      return sparql`
        ${targetClassPattern}
        ${visitor.constructPatterns}
      `
    },
    whereClause() {
      return sparql`
        ${targetClassPattern}
        ${targetClassFilter}
        ${toUnion(resourcePatterns)}
      `
    },
  }
}

function targetClass(shape: GraphPointer, focusNode: Term, prefix: string) {
  const targetClass = shape.out(sh.targetClass)
  if (!targetClass.terms.length) {
    return {}
  }

  if (isNamedNode(targetClass)) {
    return {
      targetClassPattern: $rdf.quad<BaseQuad>(focusNode, rdf.type, targetClass.term),
    }
  }

  const typeVar = $rdf.variable(prefix + '_targetClass')

  return {
    targetClassPattern: $rdf.quad<BaseQuad>(focusNode, rdf.type, typeVar),
    targetClassFilter: sparql`FILTER ( ${typeVar} ${IN(...targetClass.terms)} )`,
  }
}

function toUnion(propertyPatterns: SparqlTemplateResult[][]) {
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
