import { sparql } from '@tpluscode/sparql-builder'
import { sh } from '@tpluscode/rdf-ns-builders'
import type { GraphPointer } from 'clownface'
import NodeExpression, { Parameters } from './NodeExpression.js'

export class FocusNodeExpression extends NodeExpression {
  public readonly term = sh.this

  static match({ term }: GraphPointer) {
    return term.equals(sh.this)
  }

  static fromPointer() {
    return new FocusNodeExpression()
  }

  _buildPatterns({ subject, object }: Omit<Parameters, 'rootPatterns'>) {
    return sparql`BIND (${subject} as ${object})`
  }

  buildInlineExpression(arg: Parameters) {
    return {
      inline: sparql`${arg.subject}`,
      requiresFullContext: true,
    }
  }
}
