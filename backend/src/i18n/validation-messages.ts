import type { Lang } from './language.util.js';

const FIELD_LABELS: Record<string, Record<Lang, string>> = {
  email: { uk: 'Email', en: 'Email' },
  password: { uk: 'Пароль', en: 'Password' },
  currentPassword: { uk: 'Поточний пароль', en: 'Current password' },
  newPassword: { uk: 'Новий пароль', en: 'New password' },
  firstName: { uk: "Ім'я", en: 'First name' },
  lastName: { uk: 'Прізвище', en: 'Last name' },
  role: { uk: 'Роль', en: 'Role' },
  phone: { uk: 'Телефон', en: 'Phone' },
  salonName: { uk: 'Салон', en: 'Salon' },
  position: { uk: 'Посада', en: 'Position' },
  address: { uk: 'Адреса', en: 'Address' },
  notes: { uk: 'Нотатки', en: 'Notes' },
  assignedToId: { uk: 'Відповідальний менеджер', en: 'Assigned manager' },
  title: { uk: 'Назва угоди', en: 'Deal title' },
  amount: { uk: 'Сума', en: 'Amount' },
  clientId: { uk: 'Клієнт', en: 'Client' },
  stage: { uk: 'Стадія', en: 'Stage' },
};

function fieldLabel(property: string, lang: Lang): string {
  return FIELD_LABELS[property]?.[lang] ?? property;
}

/** A single class-validator failure, stripped of any English literal text. */
export interface ValidationIssue {
  property: string;
  constraint: string;
  args: string[];
}

type Template = (field: string, args: string[], lang: Lang) => string;

// Keyed by class-validator's constraint name (`isEmail`, `minLength`, ...).
// Add an entry here the first time a new validator decorator is used
// somewhere in the app — everything else falls back to a generic message.
const TEMPLATES: Record<string, Template> = {
  isEmail: (field, _args, lang) =>
    lang === 'uk'
      ? `Поле "${field}" має бути коректною email-адресою`
      : `"${field}" must be a valid email address`,
  isString: (field, _args, lang) =>
    lang === 'uk' ? `Поле "${field}" має бути текстом` : `"${field}" must be text`,
  isNotEmpty: (field, _args, lang) =>
    lang === 'uk' ? `Поле "${field}" обов'язкове` : `"${field}" is required`,
  minLength: (field, args, lang) =>
    lang === 'uk'
      ? `Поле "${field}" має містити щонайменше ${args[0] ?? '?'} символів`
      : `"${field}" must be at least ${args[0] ?? '?'} characters`,
  isEnum: (field, _args, lang) =>
    lang === 'uk'
      ? `Поле "${field}" містить недопустиме значення`
      : `"${field}" has an invalid value`,
  isNumber: (field, _args, lang) =>
    lang === 'uk' ? `Поле "${field}" має бути числом` : `"${field}" must be a number`,
  min: (field, args, lang) =>
    lang === 'uk'
      ? `Поле "${field}" має бути не менше ${args[0] ?? '?'}`
      : `"${field}" must be at least ${args[0] ?? '?'}`,
};

export function translateValidationIssue(issue: ValidationIssue, lang: Lang): string {
  const field = fieldLabel(issue.property, lang);
  const template = TEMPLATES[issue.constraint];
  if (template) return template(field, issue.args, lang);
  return lang === 'uk' ? `Поле "${field}" некоректне` : `"${field}" is invalid`;
}
