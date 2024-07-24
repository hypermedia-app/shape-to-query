import type sparqljs from 'sparqljs'

export function tripleEquals(triple: sparqljs.Triple) {
  return (other: sparqljs.Triple) => {
    if (!triple.subject.equals(other.subject)) {
      return false
    }
    if (!triple.object.equals(other.object)) {
      return false
    }

    if ('termType' in triple.predicate) {
      if ('termType' in other.predicate) {
        return triple.predicate.equals(other.predicate)
      }
      return false
    }

    if (!('termType' in other.predicate)) {
      return pathsEqual(triple.predicate, other.predicate)
    }

    return false
  }
}

function pathsEqual(left: sparqljs.PropertyPath, right: sparqljs.PropertyPath) {
  return left.pathType === right.pathType &&
    left.items.length === right.items.length &&
    left.items.every((item, index) => {
      const rightItem = right.items[index]
      if ('termType' in item && 'termType' in rightItem) {
        return item.equals(rightItem)
      }

      if ('pathType' in item && 'pathType' in rightItem) {
        return pathsEqual(item, rightItem)
      }

      return false
    })
}
