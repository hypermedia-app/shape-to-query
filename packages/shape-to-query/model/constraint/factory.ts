import { GraphPointer } from 'clownface'
import $rdf from 'rdf-ext'
import { sh } from '@tpluscode/rdf-ns-builders'
import { TRUE } from '../../lib/rdf.js'
import type { ModelFactory } from '../ModelFactory.js'
import { ConstraintComponent, PropertyShape } from './ConstraintComponent.js'
import { constraintComponents } from './index.js'

export default function (shape: GraphPointer, factory: ModelFactory): Array<ConstraintComponent> {
  const shapeModel = buildParameterModel(shape)

  return [...constraintComponents].flatMap(([, component]) => {
    return [...component.fromShape(shapeModel, factory)]
  })
}

function buildParameterModel(shape: GraphPointer) {
  return [...shape.dataset.match(shape.term)]
    .reduce<PropertyShape>((previousValue, { predicate }) => {
    const values = shape.out(predicate).toArray()
      .reduce((previous, pointer) => {
        if (pointer.isList()) {
          return [...previous, { list: [...pointer.list()].filter(isActive) }]
        }
        if (isActive(pointer)) {
          return [...previous, { pointer }]
        }

        return previous
      }, [])

    return previousValue.set(predicate, values)
  }, $rdf.termMap())
}

function isActive(ptr: GraphPointer) {
  return !TRUE.equals(ptr.out(sh.deactivated).term)
}
