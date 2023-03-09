import { DatasetCore } from 'rdf-js'
import { sh } from '@tpluscode/rdf-ns-builders'
import { shrink } from '@zazuko/rdf-vocabularies'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import loadShacl from '@zazuko/rdf-vocabularies/datasets/sh'
import loadDash from '@zazuko/rdf-vocabularies/datasets/dash'
import TermSet from '@rdfjs/term-set'
import { sparql } from '@tpluscode/sparql-builder'
import { TRUE } from '../../lib/rdf'
import { ConstraintComponent } from './ConstraintComponent'
import { constraintComponents } from './index'

export default function * (shape: GraphPointer): Generator<ConstraintComponent> {
  const graph = loadComponentsGraph()
  const shapeProperties = new TermSet([...shape.dataset.match(shape.term)]
    .map(({ predicate }) => predicate))

  for (const parameter of shapeProperties) {
    const componentType = graph.has(sh.path, parameter).in(sh.parameter).toArray().shift()
    if (!componentType) {
      continue
    }

    const constraintComponent = constraintComponents.get(componentType.term)
    if (!constraintComponent) {
      // eslint-disable-next-line no-console
      console.log(`No implementation found for component ${shrink(componentType.term.value) || componentType.term.value}`)
      continue
    }

    const constraintValues = shape.out(parameter)
    if ('fromPointers' in constraintComponent) {
      yield constraintComponent.fromPointers(constraintValues)
      continue
    }
    for (const constraintValue of constraintValues.toArray()) {
      if (TRUE.equals(constraintValue.out(sh.deactivated).term)) {
        continue
      }

      if ('fromList' in constraintComponent) {
        if (!constraintValue.isList()) {
          throw new Error(sparql`Object of ${parameter} must be an RDF list`.toString({ prologue: false }))
        }
        const list = constraintValue.list()
        yield constraintComponent.fromList([...list])
        continue
      }
      yield constraintComponent.fromPointer(constraintValue)
    }
  }
}

let dataset: DatasetCore

function loadComponentsGraph() {
  if (!dataset) {
    dataset = $rdf.dataset()
      .addAll(loadShacl($rdf))
      .addAll(loadDash($rdf))
  }

  return clownface({ dataset })
}
