import "#components/ak-status-label";
import "#elements/CodeMirror";
import "#elements/events/LogViewer";
import "#elements/forms/HorizontalFormElement";
import "#elements/forms/SearchSelect/index";

import { DEFAULT_CONFIG } from "#common/api/config";

import { CodeMirrorMode } from "#elements/CodeMirror";
import { Form } from "#elements/forms/Form";

import {
    CoreApi,
    CoreUsersListRequest,
    PoliciesApi,
    Policy,
    PolicyTestRequest,
    PolicyTestResult,
    User,
} from "@goauthentik/api";

import YAML from "yaml";

import { msg } from "@lit/localize";
import { CSSResult, html, TemplateResult } from "lit";
import { customElement, property, state } from "lit/decorators.js";

import PFDescriptionList from "@patternfly/patternfly/components/DescriptionList/description-list.css";

@customElement("ak-policy-test-form")
export class PolicyTestForm extends Form<PolicyTestRequest> {
    @property({ attribute: false })
    policy?: Policy;

    @state()
    result?: PolicyTestResult;

    @property({ attribute: false })
    request?: PolicyTestRequest;

    getSuccessMessage(): string {
        return msg("Successfully sent test-request.");
    }

    async send(data: PolicyTestRequest): Promise<PolicyTestResult> {
        this.request = data;
        const result = await new PoliciesApi(DEFAULT_CONFIG).policiesAllTestCreate({
            policyUuid: this.policy?.pk || "",
            policyTestRequest: data,
        });
        return (this.result = result);
    }

    static styles: CSSResult[] = [...super.styles, PFDescriptionList];

    renderResult(): TemplateResult {
        return html`
            <ak-form-element-horizontal label=${msg("Passing")}>
                <div class="pf-c-form__group-label">
                    <div class="c-form__horizontal-group">
                        <span class="pf-c-form__label-text">
                            <ak-status-label ?good=${this.result?.passing}></ak-status-label>
                        </span>
                    </div>
                </div>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal label=${msg("Messages")}>
                <div class="pf-c-form__group-label">
                    <div class="c-form__horizontal-group">
                        <ul>
                            ${(this.result?.messages || []).length > 0
                                ? this.result?.messages?.map((m) => {
                                      return html`<li>
                                          <span class="pf-c-form__label-text">${m}</span>
                                      </li>`;
                                  })
                                : html`<li>
                                      <span class="pf-c-form__label-text">-</span>
                                  </li>`}
                        </ul>
                    </div>
                </div>
            </ak-form-element-horizontal>

            <ak-form-element-horizontal label=${msg("Log messages")}>
                <div class="pf-c-form__group-label">
                    <div class="c-form__horizontal-group">
                        <dl class="pf-c-description-list pf-m-horizontal">
                            <ak-log-viewer .logs=${this.result?.logMessages}></ak-log-viewer>
                        </dl>
                    </div>
                </div>
            </ak-form-element-horizontal>
        `;
    }

    renderForm(): TemplateResult {
        return html`<ak-form-element-horizontal label=${msg("User")} required name="user">
                <ak-search-select
                    .fetchObjects=${async (query?: string): Promise<User[]> => {
                        const args: CoreUsersListRequest = {
                            ordering: "username",
                        };
                        if (query !== undefined) {
                            args.search = query;
                        }
                        const users = await new CoreApi(DEFAULT_CONFIG).coreUsersList(args);
                        return users.results;
                    }}
                    .renderElement=${(user: User): string => {
                        return user.username;
                    }}
                    .renderDescription=${(user: User): TemplateResult => {
                        return html`${user.name}`;
                    }}
                    .value=${(user: User | undefined): number | undefined => {
                        return user?.pk;
                    }}
                    .selected=${(user: User): boolean => {
                        return this.request?.user.toString() === user.pk.toString();
                    }}
                >
                </ak-search-select>
            </ak-form-element-horizontal>
            <ak-form-element-horizontal label=${msg("Context")} name="context">
                <ak-codemirror
                    mode=${CodeMirrorMode.YAML}
                    value=${YAML.stringify(this.request?.context ?? {})}
                >
                </ak-codemirror>
                <p class="pf-c-form__helper-text">
                    ${msg("Set custom attributes using YAML or JSON.")}
                </p>
            </ak-form-element-horizontal>
            ${this.result ? this.renderResult() : html``}`;
    }
}

declare global {
    interface HTMLElementTagNameMap {
        "ak-policy-test-form": PolicyTestForm;
    }
}
