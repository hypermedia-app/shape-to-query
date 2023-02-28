import { DatasetCore, NamedNode, Term } from 'rdf-js'
import TermMap from '@rdfjs/term-map'
import { sh } from '@tpluscode/rdf-ns-builders'
import { sparql } from '@tpluscode/sparql-builder'
import clownface, { GraphPointer, MultiPointer } from 'clownface'
import { shrink } from '@zazuko/rdf-vocabularies'
import loadShacl from '@zazuko/rdf-vocabularies/datasets/sh'
import loadDash from '@zazuko/rdf-vocabularies/datasets/dash'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import TermSet from '@rdfjs/term-set'
import $rdf from 'rdf-ext'
import { FocusNode, NodeShapeProcessor } from './NodeShapeProcessor'
import { emptyPatterns, merge, ShapePatterns } from './shapePatterns'

interface ConstraintParams {
  node: FocusNode
  parameters: MultiPointer
  processor: NodeShapeProcessor
}

interface Constraint {
  (arg: ConstraintParams): ShapePatterns
}

function orConstraintComponent({ node, parameters, processor }: ConstraintParams): ShapePatterns {
  const shapes = [...parameters.list()!]

  const alt = shapes.map(shape => {
    return processor.getPatterns(shape, node)
  })

  return {
    constructClause: alt.flatMap(({ constructClause }) => constructClause),
    whereClause: sparql`${UNION(...alt.map(({ whereClause }) => whereClause))}`,
  }
}

const componentImpl = new TermMap<Term, Constraint>([
  [sh.OrConstraintComponent, orConstraintComponent],
])

interface GetConstraints {
  focusNode: FocusNode
  shape: GraphPointer
  processor: NodeShapeProcessor
}

export function getConstraints({ shape, focusNode, processor }: GetConstraints): ShapePatterns {
  const graph = loadComponentsGraph()

  let patterns: ShapePatterns = emptyPatterns
  const shapeProperties = [...shape.dataset.match(shape.term)]
    .map(({ predicate }) => predicate)
    .filter(exclude(sh.property, sh.node))
  for (const parameter of shapeProperties) {
    const component = graph.has(sh.path, parameter).in(sh.parameter).toArray().shift()
    if (!component) {
      continue
    }

    const constraint = componentImpl.get(component.term)
    if (!constraint) {
      // eslint-disable-next-line no-console
      console.log(`No implementation found for component ${shrink(component.term.value) || component.term.value}`)
      continue
    }
    const nextPatterns = constraint({
      node: focusNode,
      parameters: shape.out(parameter),
      processor,
    })

    patterns = merge(patterns, nextPatterns)
  }

  return patterns
}

function exclude(...terms: NamedNode[]) {
  const excluded = new TermSet<Term>(terms)
  return (term: Term) => !excluded.has(term)
}

function loadComponentsGraph() {
  let dataset: DatasetCore

  return (() => {
    if (!dataset) {
      dataset = $rdf.dataset()
        .addAll(loadShacl($rdf))
        .addAll(loadDash($rdf))
    }

    return clownface({ dataset })
  })()
}
