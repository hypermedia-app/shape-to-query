import { PropertyShape, ShapePatterns, sparql, constructQuery } from '@hydrofoil/shape-to-query'

// subclass PropertyShape and override `nodeConstraintPatterns` method
class PropertyShapeEx extends PropertyShape {
  nodeConstraintPatterns({ constructClause, whereClause }: ShapePatterns): ShapePatterns {
    return {
      constructClause,
      whereClause: sparql`
        #pragma group.joins
        ${whereClause}
      `,
    }
  }
}

// replace the default implementation when creating the query
let pointer
const query = constructQuery(pointer, {
  PropertyShape: PropertyShapeEx,
}).build()
