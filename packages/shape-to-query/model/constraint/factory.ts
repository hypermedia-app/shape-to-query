import { DatasetCore } from 'rdf-js'
import { sh } from '@tpluscode/rdf-ns-builders'
import { shrink } from '@zazuko/rdf-vocabularies'
import clownface, { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import loadShacl from '@zazuko/rdf-vocabularies/datasets/sh'
import loadDash from '@zazuko/rdf-vocabularies/datasets/dash'
import { ConstraintComponent } from './ConstraintComponent'
import { constraintComponents } from './index'

export default function * (shape: GraphPointer): Generator<ConstraintComponent> {
  const graph = loadComponentsGraph()
  const shapeProperties = [...shape.dataset.match(shape.term)]
    .filter(({ predicate }) => !predicate.equals(sh.property))

  for (const { predicate: parameter, object } of shapeProperties) {
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

    yield constraintComponent.fromPointer(shape.node(object))
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
