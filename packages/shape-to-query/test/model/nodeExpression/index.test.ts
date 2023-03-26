import { expect } from 'chai'
import { fromNode } from '../../../nodeExpressions'
import { blankNode } from '../../nodeFactory'

describe('model/nodeExpression/index', () => {
  describe('fromNode', () => {
    it('throws when expression is unrecognized', () => {
      expect(() => fromNode(blankNode())).to.throw('Unsupported node expression')
    })
  })
})
