import "@material/mwc-textarea/mwc-textarea";
import "@material/mwc-textfield/mwc-textfield";
import { mdiEye, mdiEyeOff } from "@mdi/js";
import { css, CSSResultGroup, html, LitElement } from "lit";
import { customElement, property, state } from "lit/decorators";
import { fireEvent } from "../../common/dom/fire_event";
import { StringSelector } from "../../data/selector";
import { HomeAssistant } from "../../types";
import "../ha-icon-button";

@customElement("ha-selector-text")
export class HaTextSelector extends LitElement {
  @property() public hass!: HomeAssistant;

  @property() public value?: any;

  @property() public label?: string;

  @property() public placeholder?: string;

  @property() public selector!: StringSelector;

  @property({ type: Boolean }) public disabled = false;

  @state() private _unmaskedPassword = false;

  protected render() {
    if (this.selector.text?.multiline) {
      return html`<mwc-textarea
        .label=${this.label}
        .placeholder=${this.placeholder}
        .value=${this.value || ""}
        .disabled=${this.disabled}
        @input=${this._handleChange}
        autocapitalize="none"
        autocomplete="off"
        spellcheck="false"
        required
      ></mwc-textarea>`;
    }
    return html`<mwc-textfield
        .value=${this.value || ""}
        .placeholder=${this.placeholder || ""}
        .disabled=${this.disabled}
        .type=${this._unmaskedPassword ? "text" : this.selector.text?.type}
        @input=${this._handleChange}
        .label=${this.label || ""}
        .suffix=${this.selector.text?.type === "password"
          ? // reserve some space for the icon.
            html`<div style="width: 24px"></div>`
          : this.selector.text?.suffix}
        required
      ></mwc-textfield>
      ${this.selector.text?.type === "password"
        ? html`<ha-icon-button
            toggles
            .label=${`${this._unmaskedPassword ? "Hide" : "Show"} password`}
            @click=${this._toggleUnmaskedPassword}
            .path=${this._unmaskedPassword ? mdiEyeOff : mdiEye}
          ></ha-icon-button>`
        : ""}`;
  }

  private _toggleUnmaskedPassword(): void {
    this._unmaskedPassword = !this._unmaskedPassword;
  }

  private _handleChange(ev) {
    const value = ev.target.value;
    if (this.value === value) {
      return;
    }
    fireEvent(this, "value-changed", { value });
  }

  static get styles(): CSSResultGroup {
    return css`
      :host {
        display: block;
        position: relative;
      }
      mwc-textfield,
      mwc-textarea {
        width: 100%;
      }
      ha-icon-button {
        position: absolute;
        top: 16px;
        right: 16px;
        --mdc-icon-button-size: 24px;
        --mdc-icon-size: 20px;
        color: var(--secondary-text-color);
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "ha-selector-text": HaTextSelector;
  }
}
