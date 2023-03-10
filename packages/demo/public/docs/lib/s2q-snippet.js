/* eslint-disable import/no-extraneous-dependencies,import/no-unresolved */
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.1.0/dist/components/tab/tab.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.1.0/dist/components/tab-group/tab-group.js'
import 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.1.0/dist/components/tab-panel/tab-panel.js'
import { setBasePath } from 'https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.1.0/dist/utilities/base-path.js'
import { html, LitElement } from 'https://unpkg.com/lit?module'

setBasePath('https://cdn.jsdelivr.net/npm/@shoelace-style/shoelace@2.1.0/dist/')

customElements.define('s2q-snippet', class extends LitElement {
  firstUpdated() {
    this.renderRoot.querySelector('sl-tab-group').show('query')
  }

  render() {
    return html`
      <sl-tab-group>
        <sl-tab slot="nav" panel="shape">
          <sl-icon name="box-arrow-in-right"></sl-icon>
          &nbsp;
          Shape
        </sl-tab>
        <sl-tab slot="nav" panel="query">
          Query
          &nbsp;
          <sl-icon name="box-arrow-right"></sl-icon>
        </sl-tab>
        
        <sl-tab-panel name="shape">
          <slot name="shape"></slot>
        </sl-tab-panel>
        
        <sl-tab-panel name="query">
          <slot name="query"></slot>
        </sl-tab-panel>
      </sl-tab-group>
    `
  }
})
