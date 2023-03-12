import { NamedNode } from 'rdf-js'
import { GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'

export function getOne(pointer: GraphPointer, prop: NamedNode) {
  const object = pointer.out(prop)
  if (!isGraphPointer(object)) {
    throw new Error(`${prop.value} must have a single object`)
  }

  return object
}

export function getOneOrZero(pointer: GraphPointer, prop: NamedNode) {
  const object = pointer.out(prop)
  if (isGraphPointer(object)) {
    return object
  }

  if (object.terms.length === 0) {
    return null
  }

  throw new Error(`${prop.value} must have at most a single object`)
}
