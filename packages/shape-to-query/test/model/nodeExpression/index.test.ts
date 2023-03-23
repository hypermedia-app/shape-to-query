import { expect } from 'chai'
import { fromNode } from '../../../model/nodeExpression'
import { blankNode } from '../../nodeFactory.js'

describe('model/nodeExpression/index', () => {
  describe('fromNode', () => {
    it('throws when expression is unrecognized', () => {
      expect(() => fromNode(blankNode())).to.throw('Unsupported node expression')
    })
  })
})
