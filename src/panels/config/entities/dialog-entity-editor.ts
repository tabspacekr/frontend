import "@material/mwc-tab";
import "@material/mwc-tab-bar";
import { mdiClose, mdiTune } from "@mdi/js";
import { HassEntity } from "home-assistant-js-websocket";
import { css, CSSResultGroup, html, LitElement, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators";
import { cache } from "lit/directives/cache";
import { dynamicElement } from "../../../common/dom/dynamic-element-directive";
import { fireEvent } from "../../../common/dom/fire_event";
import { computeStateName } from "../../../common/entity/compute_state_name";
import "../../../components/ha-dialog";
import "../../../components/ha-header-bar";
import "../../../components/ha-icon-button";
import "../../../components/ha-related-items";
import {
  EntityRegistryEntry,
  ExtEntityRegistryEntry,
  getExtendedEntityRegistryEntry,
} from "../../../data/entity_registry";
import { replaceDialog } from "../../../dialogs/make-dialog-manager";
import { haStyleDialog } from "../../../resources/styles";
import type { HomeAssistant } from "../../../types";
import { documentationUrl } from "../../../util/documentation-url";
import { PLATFORMS_WITH_SETTINGS_TAB } from "./const";
import "./entity-registry-settings";
import type { EntityRegistryDetailDialogParams } from "./show-dialog-entity-editor";

interface Tabs {
  [key: string]: Tab;
}

interface Tab {
  component: string;
  translationKey: string;
}

@customElement("dialog-entity-editor")
export class DialogEntityEditor extends LitElement {
  @property({ attribute: false }) public hass!: HomeAssistant;

  @state() private _params?: EntityRegistryDetailDialogParams;

  @state() private _entry?: EntityRegistryEntry | ExtEntityRegistryEntry | null;

  @state() private _curTab = "tab-settings";

  @state() private _extraTabs: Tabs = {};

  @state() private _settingsElementTag?: string;

  private _curTabIndex = 0;

  public showDialog(params: EntityRegistryDetailDialogParams): void {
    this._params = params;
    this._entry = undefined;
    this._settingsElementTag = undefined;
    this._extraTabs = {};
    this._getEntityReg();
  }

  public closeDialog(): void {
    this._params = undefined;
    fireEvent(this, "dialog-closed", { dialog: this.localName });
  }

  protected render(): TemplateResult {
    if (!this._params || this._entry === undefined) {
      return html``;
    }
    const entityId = this._params.entity_id;
    const entry = this._entry;
    const stateObj: HassEntity | undefined = this.hass.states[entityId];

    return html`
      <ha-dialog
        open
        .heading=${stateObj
          ? computeStateName(stateObj)
          : entry?.name || entityId}
        hideActions
        @closed=${this.closeDialog}
        @close-dialog=${this.closeDialog}
      >
        <div slot="heading">
          <ha-header-bar>
            <ha-icon-button
              slot="navigationIcon"
              .label=${this.hass.localize("ui.dialogs.entity_registry.dismiss")}
              .path=${mdiClose}
              dialogAction="cancel"
            ></ha-icon-button>
            <span slot="title">
              ${stateObj ? computeStateName(stateObj) : entry?.name || entityId}
            </span>
            ${stateObj
              ? html`
                  <ha-icon-button
                    slot="actionItems"
                    .label=${this.hass.localize(
                      "ui.dialogs.entity_registry.control"
                    )}
                    .path=${mdiTune}
                    @click=${this._openMoreInfo}
                  ></ha-icon-button>
                `
              : ""}
          </ha-header-bar>
          <mwc-tab-bar
            .activeIndex=${this._curTabIndex}
            @MDCTabBar:activated=${this._handleTabActivated}
            @MDCTab:interacted=${this._handleTabInteracted}
          >
            <mwc-tab
              id="tab-settings"
              .label=${this.hass.localize(
                "ui.dialogs.entity_registry.settings"
              )}
            >
            </mwc-tab>
            ${Object.entries(this._extraTabs).map(
              ([key, tab]) => html`
                <mwc-tab
                  id=${key}
                  .label=${this.hass.localize(tab.translationKey) || key}
                >
                </mwc-tab>
              `
            )}
            <mwc-tab
              id="tab-related"
              .label=${this.hass.localize("ui.dialogs.entity_registry.related")}
            >
            </mwc-tab>
          </mwc-tab-bar>
        </div>
        <div class="wrapper">${cache(this._renderTab())}</div>
      </ha-dialog>
    `;
  }

  private _renderTab() {
    switch (this._curTab) {
      case "tab-settings":
        if (this._entry) {
          if (this._settingsElementTag) {
            return html`
              ${dynamicElement(this._settingsElementTag, {
                hass: this.hass,
                entry: this._entry,
                entityId: this._params!.entity_id,
              })}
            `;
          }
          return html``;
        }
        return html`
          <div class="content">
            ${this.hass.localize(
              "ui.dialogs.entity_registry.no_unique_id",
              "entity_id",
              this._params!.entity_id,
              "faq_link",
              html`<a
                href=${documentationUrl(this.hass, "/faq/unique_id")}
                target="_blank"
                rel="noreferrer"
                >${this.hass.localize("ui.dialogs.entity_registry.faq")}</a
              >`
            )}
          </div>
        `;
      case "tab-related":
        return html`
          <ha-related-items
            class="content"
            .hass=${this.hass}
            .itemId=${this._params!.entity_id}
            itemType="entity"
          ></ha-related-items>
        `;
      default:
        return html``;
    }
  }

  private async _getEntityReg() {
    try {
      this._entry = await getExtendedEntityRegistryEntry(
        this.hass,
        this._params!.entity_id
      );
      this._loadPlatformSettingTabs();
    } catch {
      this._entry = null;
    }
  }

  private _handleTabActivated(ev: CustomEvent): void {
    this._curTabIndex = ev.detail.index;
  }

  private _handleTabInteracted(ev: CustomEvent): void {
    this._curTab = ev.detail.tabId;
  }

  private async _loadPlatformSettingTabs(): Promise<void> {
    if (!this._entry) {
      return;
    }
    if (
      !Object.keys(PLATFORMS_WITH_SETTINGS_TAB).includes(this._entry.platform)
    ) {
      this._settingsElementTag = "entity-registry-settings";
      return;
    }
    const tag = PLATFORMS_WITH_SETTINGS_TAB[this._entry.platform];
    await import(`./editor-tabs/settings/${tag}`);
    this._settingsElementTag = tag;
  }

  private _openMoreInfo(): void {
    replaceDialog();
    fireEvent(this, "hass-more-info", {
      entityId: this._params!.entity_id,
    });
    this.closeDialog();
  }

  static get styles(): CSSResultGroup {
    return [
      haStyleDialog,
      css`
        ha-header-bar {
          --mdc-theme-on-primary: var(--primary-text-color);
          --mdc-theme-primary: var(--mdc-theme-surface);
          flex-shrink: 0;
        }

        mwc-tab-bar {
          border-bottom: 1px solid
            var(--mdc-dialog-scroll-divider-color, rgba(0, 0, 0, 0.12));
        }

        ha-dialog {
          --dialog-content-position: static;
          --dialog-content-padding: 0;
          --dialog-z-index: 6;
        }

        @media all and (min-width: 451px) and (min-height: 501px) {
          .wrapper {
            min-width: 400px;
          }
        }

        .content {
          display: block;
          padding: 20px 24px;
        }

        /* overrule the ha-style-dialog max-height on small screens */
        @media all and (max-width: 450px), all and (max-height: 500px) {
          ha-header-bar {
            --mdc-theme-primary: var(--app-header-background-color);
            --mdc-theme-on-primary: var(--app-header-text-color, white);
          }
        }

        mwc-button.warning {
          --mdc-theme-primary: var(--error-color);
        }

        :host([rtl]) app-toolbar {
          direction: rtl;
          text-align: right;
        }
      `,
    ];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    "dialog-entity-editor": DialogEntityEditor;
  }
}
