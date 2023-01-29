import { html, css, LitElement } from 'lit'
import '@rdfjs-elements/rdf-editor'
import '@rdfjs-elements/sparql-editor'
import '@shoelace-style/shoelace/dist/components/button/button.js'
import '@shoelace-style/shoelace/dist/components/input/input.js'
import { construct } from '@hydrofoil/shape-to-query'
import $rdf from 'rdf-ext'
import { rdf, sh } from '@tpluscode/rdf-ns-builders'

customElements.define('shape-to-query', class extends LitElement {
  static get styles() {
    return css`
      :host {
        display: block;
        margin: 0 auto ;
        width: 100% ;
      }

      rdf-editor {
        height: 500px;
      }
    `
  }

  static get properties() {
    return {
      query: { type: String },
    }
  }

  get shape() {
    const dataset = $rdf.dataset([...this.renderRoot.querySelector('rdf-editor').quads])
    return $rdf.clownface({ dataset }).has(rdf.type, sh.NodeShape)
  }

  get focusNode() {
    return this.renderRoot.querySelector('#focus-node').value
  }

  render() {
    return html`
      <rdf-editor format="text/turtle" @parsing-failed="${console.error}"></rdf-editor>
      <sl-input id="focus-node"></sl-input>
      <sl-button variant="primary" @click="${this.generateQuery}">Generate</sl-button>
      <sparql-editor readonly .value="${this.query}"></sparql-editor>
    `
  }

  generateQuery() {
    const opts = {}
    if (this.focusNode) {
      opts.focusNode = $rdf.namedNode(this.focusNode)
    }

    this.query = construct(this.shape, opts).build()
  }
})
