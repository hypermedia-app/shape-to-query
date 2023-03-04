import { sparql } from '@tpluscode/sparql-builder'
import { UNION } from '@tpluscode/sparql-builder/expressions'
import { isResource } from 'is-graph-pointer'
import { FocusNode } from '../lib/FocusNode'
import { ShapePatterns, unique } from '../lib/shapePatterns'
import { VariableSequence } from '../lib/variableSequence'
import { PropertyShape } from './PropertyShape'
import { Target, TargetNode } from './target'
import { ConstraintComponent } from './constraint/ConstraintComponent'

interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
}

export interface NodeShape {
  buildPatterns(arg: Parameters): ShapePatterns
}

export default class implements NodeShape {
  constructor(
    public readonly targets: ReadonlyArray<Target>,
    public readonly properties: ReadonlyArray<PropertyShape>,
    public readonly constraints: ReadonlyArray<ConstraintComponent>,
  ) {
  }

  buildPatterns(arg: Parameters): ShapePatterns {
    let { focusNode, variable } = arg

    let targets: ShapePatterns[] = []
    if (focusNode.termType === 'Variable') {
      targets = this.targets.flatMap(target => target.buildPatterns(<any>{ focusNode, variable }))
    }
    if (this.targets.length === 1 && this.targets[0] instanceof TargetNode) {
      const [target] = this.targets
      if (isResource(target.nodes)) {
        targets = []
        focusNode = target.nodes.term
      }
    }

    const constraints = this.constraints.map(c => c.buildPatterns({ focusNode, variable }))
    const properties = this.properties.map(p => p.buildPatterns({ focusNode, variable }))

    return {
      constructClause: unique(
        ...targets.map(t => t.constructClause),
        ...constraints.map(c => c.constructClause),
        ...properties.map(p => p.constructClause),
      ),
      whereClause: sparql`
        ${UNION(...targets.map(t => t.whereClause))}
        ${UNION(...constraints.map(t => t.whereClause))}
        ${UNION(...properties.map(t => t.whereClause))}
      `,
    }
  }
}
