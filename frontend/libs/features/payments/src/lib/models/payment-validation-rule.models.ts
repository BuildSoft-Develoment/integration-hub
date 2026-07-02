export type PaymentRuleSeverity = 'E' | 'W' | 'I';

export type PaymentRulePredicateKind =
  | 'FIELD_REQUIRED'
  | 'FIELD_FORBIDDEN'
  | 'OPTION_ALLOWED'
  | 'MAX_LENGTH'
  | 'CURRENCY_ALLOWED'
  | 'AMOUNT_MAX'
  | 'CHARGES_ALLOWED'
  | 'JEXL';

export interface PaymentValidationRuleRecord {
  id: number;
  ruleSet: string;
  code: string;
  standard: string;
  appliesTo: string;
  severity: PaymentRuleSeverity;
  predicateKind: PaymentRulePredicateKind;
  predicateBody: string;
  active: boolean;
}

export interface PaymentValidationRuleDraft {
  id: number | null;
  ruleSet: string;
  code: string;
  standard: string;
  appliesTo: string;
  severity: PaymentRuleSeverity;
  predicateKind: PaymentRulePredicateKind;
  predicateBody: string;
  active: boolean;
}

export interface PaymentValidationRulePageResponse {
  total: number;
  items: PaymentValidationRuleRecord[];
}

export interface PaymentValidationRuleImportResponse {
  ruleSet: string;
  imported: number;
  replacedExisting: boolean;
}

export interface PaymentValidationRuleImportPayload {
  ruleSet: string;
  replaceExisting: boolean;
  rules: PaymentValidationRuleDraft[];
}

export function createPaymentRuleDraft(ruleSet = 'bank:TEST'): PaymentValidationRuleDraft {
  return {
    id: null,
    ruleSet,
    code: '',
    standard: 'SWIFT',
    appliesTo: 'MT101',
    severity: 'E',
    predicateKind: 'FIELD_REQUIRED',
    predicateBody: '{\n  "path": "transactions[].beneficiary.account"\n}',
    active: true,
  };
}

export function toPaymentRuleDraft(rule: PaymentValidationRuleRecord): PaymentValidationRuleDraft {
  return { ...rule };
}
