import { DatasetCore } from 'rdf-js'
import { sh } from '@tpluscode/rdf-ns-builders'
import { shrink } from '@zazuko/rdf-vocabularies'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import loadShacl from '@zazuko/rdf-vocabularies/datasets/sh'
import loadDash from '@zazuko/rdf-vocabularies/datasets/dash'
import TermSet from '@rdfjs/term-set'
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
    } else {
      for (const constraintValue of constraintValues.toArray()) {
        yield constraintComponent.fromPointer(constraintValue)
      }
    }
  }
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
