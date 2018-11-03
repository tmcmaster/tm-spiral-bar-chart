import {html, PolymerElement} from '@polymer/polymer/polymer-element.js';

/**
 * `tm-spiral-bar-chart`
 * Spiral bar chart Polymer web component.
 *
 * @customElement
 * @polymer
 * @demo demo/index.html
 */
class TmSpiralBarChart extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
        }
      </style>
      <h2>Hello [[prop1]]!</h2>
    `;
  }
  static get properties() {
    return {
      prop1: {
        type: String,
        value: 'tm-spiral-bar-chart',
      },
    };
  }
}

window.customElements.define('tm-spiral-bar-chart', TmSpiralBarChart);
