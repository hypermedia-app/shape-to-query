import { PropertyShape, constructQuery } from '@hydrofoil/shape-to-query'
import rdf from '@zazuko/env/web.js'
import type { BuildParameters } from '@hydrofoil/shape-to-query/model/Shape.js'
import type sparqljs from 'sparqljs'

/*
 * WARNING: this uses patched sparqljs to add support for comments
 */

// subclass PropertyShape and override `buildConstraints` method
class PropertyShapeEx extends PropertyShape {
  buildConstraints(arg: BuildParameters): sparqljs.Pattern[] {
    return [
      { type: 'comment', text: 'pragma group.joins' },
      ...super.buildConstraints(arg),
    ]
  }
}

// replace the default implementation when creating the query
const pointer = rdf.clownface()
  .blankNode()
  .addOut(rdf.ns.sh.property, p => p.addOut(rdf.ns.sh.path, rdf.ns.schema.name))
const query = constructQuery(pointer, {
  PropertyShape: PropertyShapeEx,
})

console.log(query)
