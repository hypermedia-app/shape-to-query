import type { GraphPointer } from 'clownface'
import type sparqljs from 'sparqljs'
import { FocusNode } from '../../lib/FocusNode.js'
import { VariableSequence } from '../../lib/variableSequence.js'
import { ShapePatterns } from '../../lib/shapePatterns.js'
import { ModelFactory } from '../ModelFactory.js'
import type { PropertyShape } from '../PropertyShape.js'

export interface Parameters {
  focusNode: FocusNode
  variable: VariableSequence
  rootPatterns: sparqljs.Pattern[]
}

export interface Rule {
  buildPatterns({ focusNode, variable, rootPatterns }: Parameters): ShapePatterns
}

export interface RuleStatic {
  matches(pointer: GraphPointer): boolean
  fromPointer(pointer: GraphPointer, factory: ModelFactory): Rule
}

export function union(arg: Parameters) {
  return function (acc: ShapePatterns, rule: Rule | PropertyShape, index: number, arr: readonly Rule[]): ShapePatterns {
    const result = rule.buildPatterns(arg)
    let whereClause: sparqljs.Pattern[]
    if (index === 0 && arr.length === 1) {
      whereClause = [groupPatterns(result.whereClause)]
    } else {
      const group = groupPatterns(result.whereClause)
      let union: sparqljs.UnionPattern

      if (acc.whereClause.length === 1 && acc.whereClause[0].type === 'union') {
        union = acc.whereClause[0] as sparqljs.UnionPattern
      } else {
        union = {
          type: 'union',
          patterns: [],
        }
      }

      union.patterns.push(group)
      whereClause = [union]
    }

    return {
      constructClause: [...acc.constructClause, ...result.constructClause],
      whereClause,
      childPatterns: [...acc.childPatterns, ...result.childPatterns || []],
      unionPatterns: [...acc.unionPatterns || [], ...result.unionPatterns || []],
    }
  }
}

function groupPatterns(patterns: sparqljs.Pattern[]): sparqljs.GroupPattern {
  if (patterns.length === 1 && patterns[0].type === 'group') {
    return patterns[0] as sparqljs.GroupPattern
  }
  return {
    type: 'group',
    patterns,
  }
}
