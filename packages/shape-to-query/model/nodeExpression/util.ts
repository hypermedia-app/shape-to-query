import { NamedNode } from 'rdf-js'
import { AnyPointer, GraphPointer } from 'clownface'
import { isGraphPointer } from 'is-graph-pointer'

interface Check<P extends GraphPointer> {
  (arg: AnyPointer): arg is P
}

export function getOne<P extends GraphPointer>(pointer: P | GraphPointer, prop: NamedNode, check: Check<P> = <any>isGraphPointer): P {
  const object = pointer.out(prop)
  if (!check(object)) {
    throw new Error(`${prop.value} must have a single object`)
  }

  return object
}

export function getOneOrZero<P extends GraphPointer>(pointer: P | GraphPointer, prop: NamedNode, check: Check<P> = <any>isGraphPointer): P {
  const object = pointer.out(prop)
  if (check(object)) {
    return object
  }

  if (object.terms.length === 0) {
    return null
  }

  throw new Error(`${prop.value} must have at most a single object`)
}
