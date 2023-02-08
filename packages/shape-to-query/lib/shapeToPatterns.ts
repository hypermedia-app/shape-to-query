import { BaseQuad, NamedNode } from 'rdf-js'
import type { AnyPointer, GraphPointer } from 'clownface'
import { sparql, SparqlTemplateResult } from '@tpluscode/rdf-string'
import { rdf, sh, xsd } from '@tpluscode/rdf-ns-builders'
import $rdf from '@rdfjs/data-model'
import { IN, VALUES } from '@tpluscode/sparql-builder/expressions'
import TermSet from '@rdfjs/term-set'
import { isBlankNode, isNamedNode } from 'is-graph-pointer'
import factory from '@rdfjs/data-model'
import { create, PrefixedVariable } from './variableFactory'

export interface Options {
  subjectVariable?: string
  focusNode?: NamedNode
  objectVariablePrefix?: string
}

type PropertyShapeOptions = Pick<Options, 'objectVariablePrefix'>

const TRUE = $rdf.literal('true', xsd.boolean)

interface ShapePatterns extends Iterable<SparqlTemplateResult> {
  whereClause(): SparqlTemplateResult
  constructClause(): SparqlTemplateResult
}

export function shapeToPatterns(shape: GraphPointer, options: Options): ShapePatterns {
  const focusNode = create({
    focusNode: options.focusNode,
    prefix: options.subjectVariable || 'resource',
  })

  const { targetClassPattern, targetClassFilter } = targetClass(shape, focusNode)
  const resourcePatterns = [...deepPropertyShapePatterns({
    shape,
    focusNode,
    options,
  })]

  const flatPatterns = () => [targetClassPattern, ...resourcePatterns
    .flat()
    .map(elem => {
      if (elem.toString().includes('VALUES')) {
        // @ts-expect-error this is a hack
        return factory.quad(elem?.values[0], elem?.values[1], elem?.values[2])
      }

      return elem
    })
    .filter((quad): quad is BaseQuad => 'subject' in quad)
    .reduce((set, quad) => set.add(quad), new TermSet()),
  ].map(quad => sparql`${quad}`)

  return {
    [Symbol.iterator]() {
      return flatPatterns()[Symbol.iterator]()
    },
    constructClause() {
      return sparql`
        ${[...flatPatterns()]}
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

function targetClass(shape: GraphPointer, focusNode: PrefixedVariable) {
  const targetClass = shape.out(sh.targetClass)
  if (!targetClass.terms.length) {
    return {}
  }

  if (isNamedNode(targetClass)) {
    return {
      targetClassPattern: $rdf.quad(focusNode(), rdf.type, targetClass.term),
    }
  }

  const typeVar = focusNode.extend('targetClass')

  return {
    targetClassPattern: $rdf.quad(focusNode(), rdf.type, typeVar()),
    targetClassFilter: sparql`FILTER ( ${typeVar()} ${IN(...targetClass.terms)} )`,
  }
}

type Pattern = BaseQuad | SparqlTemplateResult

function toUnion(propertyPatterns: Pattern[][]) {
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
  focusNode: PrefixedVariable
  options: PropertyShapeOptions
  parentPatterns?: Pattern[]
}

function * deepPropertyShapePatterns({ shape, focusNode, options, parentPatterns = [] }: PropertyShapePatterns): Generator<Pattern[]> {
  const activeProperties = shape.out(sh.property)
    .filter(propShape => !propShape.has(sh.deactivated, TRUE).term)
    .toArray()

  for (const [index, propShape] of activeProperties.entries()) {
    const variable = options.objectVariablePrefix
      ? focusNode.extend(options.objectVariablePrefix).extend(index)
      : focusNode.extend(index)

    const path = propShape.out(sh.path)

    let selfPatterns: Pattern[] = []
    if (isNamedNode(path)) {
      selfPatterns = [$rdf.quad(focusNode(), path.term, variable())]
    } else if (isDeepPathPattern(path)) {
      const property = <NamedNode>path.out([sh.zeroOrMorePath, sh.oneOrMorePath]).term
      const intermediateNode = variable.extend('i')()

      selfPatterns = [
        sparql`${focusNode()} ${property}* ${intermediateNode} .`,
        $rdf.quad(intermediateNode, property, variable()),
      ]
    } else if (isAlternativePathPattern(path)) {
      const property = [...path.out(sh.alternativePath).list()].map(e => e.term)

      if (!property.every(term => term.termType === 'NamedNode')) {
        continue
      }

      const intermediateNode = variable.extend('i')()
      const v = variable()

      selfPatterns = [
        sparql`${focusNode()} ${v} ${intermediateNode} . ${VALUES({ [v.value]: property[0] }, { [v.value]: property[1] })}`,
      ]
    } else {
      continue
    }

    const combinedPatterns = [...parentPatterns, ...selfPatterns]

    yield combinedPatterns

    const shNodes = propShape.out(sh.node).toArray()
    for (const shNode of shNodes) {
      const deepPatterns = deepPropertyShapePatterns({
        shape: shNode,
        focusNode: variable,
        options,
        parentPatterns: combinedPatterns,
      })
      for (const deepPattern of deepPatterns) {
        yield deepPattern
      }
    }
  }
}

function isDeepPathPattern(pointer: AnyPointer) {
  return isBlankNode(pointer) && isNamedNode(pointer.out([sh.zeroOrMorePath, sh.oneOrMorePath]))
}

function isAlternativePathPattern(pointer: AnyPointer) {
  return isBlankNode(pointer) && isBlankNode(pointer.out([sh.alternativePath]))
}
