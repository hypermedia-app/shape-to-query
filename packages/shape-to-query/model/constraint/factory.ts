import { GraphPointer } from 'clownface'
import ModelFactory from '../ModelFactory.js'
import { ConstraintComponent } from './ConstraintComponent.js'
import { constraintComponents } from './index.js'

export default function (shape: GraphPointer): Array<ConstraintComponent> {
  const factory = new ModelFactory()

  return [...constraintComponents].flatMap(([, component]) => {
    return [...component.fromShape(shape, factory)]
  })
}
