import "#admin/enterprise/EnterpriseLicenseForm";
import "#admin/enterprise/EnterpriseStatusCard";
import "#admin/rbac/ObjectPermissionModal";
import "#elements/Spinner";
import "#elements/buttons/SpinnerButton/index";
import "#elements/cards/AggregateCard";
import "#elements/forms/DeleteBulkForm";
import "#elements/forms/ModalForm";
import "@patternfly/elements/pf-tooltip/pf-tooltip.js";

import { DEFAULT_CONFIG } from "#common/api/config";
import { formatElapsedTime } from "#common/temporal";

import { PFColor } from "#elements/Label";
import { PaginatedResponse, TableColumn } from "#elements/table/Table";
import { TablePage } from "#elements/table/TablePage";

import {
    EnterpriseApi,
    License,
    LicenseForecast,
    LicenseSummary,
    LicenseSummaryStatusEnum,
    RbacPermissionsAssignedByUsersListModelEnum,
} from "@goauthentik/api";

import { msg, str } from "@lit/localize";
import { css, CSSResult, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import PFBanner from "@patternfly/patternfly/components/Banner/banner.css";
import PFButton from "@patternfly/patternfly/components/Button/button.css";
import PFCard from "@patternfly/patternfly/components/Card/card.css";
import PFFormControl from "@patternfly/patternfly/components/FormControl/form-control.css";
import PFGrid from "@patternfly/patternfly/layouts/Grid/grid.css";

@customElement("ak-enterprise-license-list")
export class EnterpriseLicenseListPage extends TablePage<License> {
    checkbox = true;
    clearOnRefresh = true;

    searchEnabled(): boolean {
        return true;
    }
    pageTitle(): string {
        return msg("Licenses");
    }
    pageDescription(): string {
        return msg("Manage enterprise licenses");
    }
    pageIcon(): string {
        return "pf-icon pf-icon-key";
    }

    @property()
    order = "name";

    @state()
    forecast?: LicenseForecast;

    @state()
    summary?: LicenseSummary;

    @state()
    installID?: string;

    static styles: CSSResult[] = [
        ...super.styles,
        PFGrid,
        PFBanner,
        PFFormControl,
        PFButton,
        PFCard,
        css`
            .pf-m-no-padding-bottom {
                padding-bottom: 0;
            }
            .install-id {
                word-break: break-all;
            }
        `,
    ];

    async apiEndpoint(): Promise<PaginatedResponse<License>> {
        this.forecast = await new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseForecastRetrieve();
        this.summary = await new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseSummaryRetrieve({
            cached: false,
        });
        this.installID = (
            await new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseInstallIdRetrieve()
        ).installId;
        return new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseList(
            await this.defaultEndpointConfig(),
        );
    }

    columns(): TableColumn[] {
        return [
            new TableColumn(msg("Name"), "name"),
            new TableColumn(msg("Users")),
            new TableColumn(msg("Expiry date")),
            new TableColumn(msg("Actions")),
        ];
    }

    // TODO: Make this more generic, maybe automatically get the plural name
    // of the object to use in the renderEmpty
    renderEmpty(inner?: TemplateResult): TemplateResult {
        return super.renderEmpty(html`
            ${inner
                ? inner
                : html`<ak-empty-state icon=${this.pageIcon()}
                      ><span>${msg("No licenses found.")}</span>
                      <div slot="body">
                          ${this.searchEnabled() ? this.renderEmptyClearSearch() : html``}
                      </div>
                      <div slot="primary">${this.renderObjectCreate()}</div>
                  </ak-empty-state>`}
        `);
    }

    renderToolbarSelected(): TemplateResult {
        const disabled = this.selectedElements.length < 1;
        return html`<ak-forms-delete-bulk
            objectLabel=${msg("License(s)")}
            .objects=${this.selectedElements}
            .metadata=${(item: License) => {
                return [
                    { key: msg("Name"), value: item.name },
                    { key: msg("Expiry"), value: item.expiry?.toLocaleString() },
                ];
            }}
            .usedBy=${(item: License) => {
                return new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseUsedByList({
                    licenseUuid: item.licenseUuid,
                });
            }}
            .delete=${(item: License) => {
                return new EnterpriseApi(DEFAULT_CONFIG).enterpriseLicenseDestroy({
                    licenseUuid: item.licenseUuid,
                });
            }}
        >
            <button ?disabled=${disabled} slot="trigger" class="pf-c-button pf-m-danger">
                ${msg("Delete")}
            </button>
        </ak-forms-delete-bulk>`;
    }

    renderSectionBefore(): TemplateResult {
        return html`
            <section class="pf-c-page__main-section pf-m-no-padding-bottom">
                <div
                    class="pf-l-grid pf-m-gutter pf-m-all-6-col-on-sm pf-m-all-4-col-on-md pf-m-all-3-col-on-lg pf-m-all-3-col-on-xl"
                >
                    ${this.renderGetLicenseCard()}
                    <ak-aggregate-card
                        class="pf-l-grid__item"
                        icon="pf-icon pf-icon-user"
                        header=${msg("Forecast internal users")}
                        subtext=${msg(
                            str`Estimated user count one year from now based on ${this.forecast?.internalUsers} current internal users and ${this.forecast?.forecastedInternalUsers} forecasted internal users.`,
                        )}
                    >
                        ~&nbsp;${(this.forecast?.internalUsers || 0) +
                        (this.forecast?.forecastedInternalUsers || 0)}
                    </ak-aggregate-card>
                    <ak-aggregate-card
                        class="pf-l-grid__item"
                        icon="pf-icon pf-icon-user"
                        header=${msg("Forecast external users")}
                        subtext=${msg(
                            str`Estimated user count one year from now based on ${this.forecast?.externalUsers} current external users and ${this.forecast?.forecastedExternalUsers} forecasted external users.`,
                        )}
                    >
                        ~&nbsp;${(this.forecast?.externalUsers || 0) +
                        (this.forecast?.forecastedExternalUsers || 0)}
                    </ak-aggregate-card>
                    <ak-aggregate-card
                        class="pf-l-grid__item"
                        icon="pf-icon pf-icon-user"
                        header=${msg("Expiry")}
                        subtext=${msg("Cumulative license expiry")}
                    >
                        ${this.summary &&
                        this.summary?.status !== LicenseSummaryStatusEnum.Unlicensed
                            ? html`<div>${formatElapsedTime(this.summary.latestValid)}</div>
                                  <small>${this.summary.latestValid.toLocaleString()}</small>`
                            : "-"}
                    </ak-aggregate-card>
                </div>
            </section>
            <section class="pf-c-page__main-section pf-m-no-padding-bottom">
                <ak-enterprise-status-card
                    .summary=${this.summary}
                    .forecast=${this.forecast}
                ></ak-enterprise-status-card>
            </section>
        `;
    }

    row(item: License): TemplateResult[] {
        let color = PFColor.Green;
        if (item.expiry) {
            const now = new Date();
            const inAMonth = new Date();
            inAMonth.setDate(inAMonth.getDate() + 30);
            if (item.expiry <= inAMonth) {
                color = PFColor.Orange;
            }
            if (item.expiry <= now) {
                color = PFColor.Red;
            }
        }
        return [
            html`<div>${item.name}</div>`,
            html`<div>${msg(str`Internal: ${item.internalUsers}`)}</div>
                <div>${msg(str`External: ${item.externalUsers}`)}</div>`,
            html`<ak-label color=${color}> ${item.expiry?.toLocaleString()} </ak-label>`,
            html`<ak-forms-modal>
                    <span slot="submit"> ${msg("Update")} </span>
                    <span slot="header"> ${msg("Update License")} </span>
                    <ak-enterprise-license-form slot="form" .instancePk=${item.licenseUuid}>
                    </ak-enterprise-license-form>
                    <button slot="trigger" class="pf-c-button pf-m-plain">
                        <pf-tooltip position="top" content=${msg("Edit")}>
                            <i class="fas fa-edit"></i>
                        </pf-tooltip>
                    </button>
                </ak-forms-modal>
                <ak-rbac-object-permission-modal
                    model=${RbacPermissionsAssignedByUsersListModelEnum.AuthentikEnterpriseLicense}
                    objectPk=${item.licenseUuid}
                >
                </ak-rbac-object-permission-modal> `,
        ];
    }

    renderGetLicenseCard() {
        const renderSpinner = () =>
            html` <div class="pf-c-card__body">
                <ak-spinner></ak-spinner>
            </div>`;

        const installURL = (installID: string) =>
            [
                "https://customers.goauthentik.io/from_authentik/purchase/?install_id=",
                encodeURIComponent(installID),
                "&authentik_url=",
                encodeURI(window.location.origin),
            ].join("");

        const renderCard = (installID: string) => html`
            <div class="pf-c-card__title">${msg("Your Install ID")}</div>
            <div class="pf-c-card__body install-id pf-m-monospace">${installID}</div>
            <div class="pf-c-card__body">
                <a
                    target="_blank"
                    href="${installURL(installID)}"
                    class="pf-c-button pf-m-primary pf-m-block"
                    >${msg("Go to Customer Portal")}</a
                >
            </div>
            <div class="pf-c-card__body">
                <a target="_blank" href="https://docs.goauthentik.io/docs/enterprise/get-started"
                    >${msg("Learn more")}</a
                >
            </div>
        `;

        return html`<div class="pf-l-grid__item pf-c-card">
            ${this.installID ? renderCard(this.installID) : renderSpinner()}
        </div> `;
    }

    renderObjectCreate(): TemplateResult {
        return html`
            <ak-forms-modal>
                <span slot="submit"> ${msg("Install")} </span>
                <span slot="header"> ${msg("Install License")} </span>
                <ak-enterprise-license-form slot="form"> </ak-enterprise-license-form>
                <button slot="trigger" class="pf-c-button pf-m-primary">${msg("Install")}</button>
            </ak-forms-modal>
        `;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-enterprise-license-list": EnterpriseLicenseListPage;
    }
}
