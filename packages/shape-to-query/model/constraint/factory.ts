import { sh } from '@tpluscode/rdf-ns-builders'
import { shrink } from '@zazuko/prefixes'
import { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { sparql } from '@tpluscode/sparql-builder'
import vocabulary from '../../vocabulary.js'
import { TRUE } from '../../lib/rdf.js'
import { ConstraintComponent } from './ConstraintComponent.js'
import { constraintComponents } from './index.js'

export default function * (shape: GraphPointer): Generator<ConstraintComponent> {
  const shapeProperties = $rdf.termSet([...shape.dataset.match(shape.term)]
    .map(({ predicate }) => predicate))

  for (const parameter of shapeProperties) {
    const componentType = vocabulary.has(sh.path, parameter).in(sh.parameter).toArray().shift()
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
        const list = [...constraintValue.list()]
          .filter(el => !TRUE.equals(el.out(sh.deactivated).term))
        yield constraintComponent.fromList(list)
        continue
      }
      yield constraintComponent.fromPointer(constraintValue)
    }
  }
}
