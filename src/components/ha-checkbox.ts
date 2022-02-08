import { Checkbox } from "@material/mwc-checkbox";
import { css } from "lit";
import { customElement } from "lit/decorators";

const styles = [
  ...Checkbox.styles,
  css`
    :host {
      --mdc-theme-secondary: var(--primary-color);
    }
  `,
];
@customElement("ha-checkbox")
export class HaCheckbox extends Checkbox {
  static get styles() {
    return styles;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-checkbox": HaCheckbox;
  }
}
