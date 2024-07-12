import type { Pattern, ValuePatternRow } from 'sparqljs'

export function valuesHasRow(row: ValuePatternRow) {
  const entries = Object.entries(row)

  return (pattern: Pattern) => {
    if (pattern.type === 'values') {
      return pattern.values.some(other => {
        return entries.every(([key, value]) => {
          return other[key]?.equals(value)
        })
      })
    }

    return false
  }
}
