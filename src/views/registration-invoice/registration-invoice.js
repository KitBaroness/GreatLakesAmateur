/**
 * FlexNet registration and invoice view.
 * Pure invoice helpers separated from DOM and storage side effects.
 */

import { escapeHtml } from '../../utilities/escapeHtml.js';
import { loadScript } from '../../utilities/loadCdnAsset.js';
import SiteConfig from '../../core/site-config.js';

const REGISTRATION_FORM_SELECTOR = '[data-registration-form]';
const REGISTRATION_ROOT_SELECTOR = '[data-registration-root]';
const VENMO_NOTE_MAX_LENGTH = 500;

const runtime = Object.seal({
  boundRoot: null,
  clickHandler: null,
  changeHandler: null
});

/**
 * @pure
 * @param {Date} date
 * @returns {String}
 */
const formatInvoiceDate = (date = new Date()) => date.toLocaleDateString('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric'
});

/**
 * @pure
 * @param {Date} date
 * @returns {String}
 */
const formatInvoiceDateStamp = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
};

/**
 * @pure
 * @returns {String}
 */
const generateInvoiceSuffix = () => Math.random().toString(36).slice(2, 6).toUpperCase();

/**
 * @pure
 * @param {Object} registrationConfig
 * @param {Date} date
 * @returns {String}
 */
const generateInvoiceNumber = (registrationConfig, date = new Date()) => (
  `${registrationConfig.invoicePrefix}-${formatInvoiceDateStamp(date)}-${generateInvoiceSuffix()}`
);

/**
 * @pure
 * @param {Object} config
 * @param {String} routePath
 * @returns {Boolean}
 */
const shouldRenderRegistrationForm = (config, routePath) => (
  routePath === config.registration?.route
);

/**
 * @pure
 * @param {Number} amountNumeric
 * @returns {String}
 */
const formatCurrency = (amountNumeric) => {
  const normalized = Number(amountNumeric);
  const hasCents = normalized % 1 !== 0;

  return hasCents
    ? `$${normalized.toFixed(2)}`
    : `$${normalized.toLocaleString('en-US', { maximumFractionDigits: 0 })}`;
};

/**
 * @pure
 * @param {Object} config
 * @returns {Array}
 */
const getHashQueryFeeKeys = (config) => {
  const hash = window.location.hash.replace(/^#/, '');
  const queryIndex = hash.indexOf('?');
  const query = queryIndex >= 0 ? hash.slice(queryIndex + 1) : '';
  const params = new URLSearchParams(query);
  const keys = params.getAll('fee')
    .flatMap((value) => value.split(','))
    .map((key) => key.trim())
    .filter(Boolean);

  return [...new Set(keys.filter((key) => SiteConfig.getRegistrationFeeOption(config, key)))];
};

/**
 * @pure
 * @param {Object} config
 * @param {Array} feeKeys
 * @returns {Array}
 */
const resolveFeeItems = (config, feeKeys) => (
  feeKeys
    .map((key) => SiteConfig.getRegistrationFeeOption(config, key))
    .filter(Boolean)
    .map((option) => ({
      key: option.key,
      label: option.label,
      shortLabel: option.shortLabel || option.label,
      amount: option.amount,
      amountNumeric: option.amountNumeric,
      category: option.category
    }))
);

/**
 * @pure
 * @param {Array} feeItems
 * @returns {Object}
 */
const summarizeFeeItems = (feeItems) => {
  const feeAmountNumeric = feeItems.reduce((total, item) => total + item.amountNumeric, 0);

  return {
    feeItems,
    feeKeys: feeItems.map((item) => item.key),
    feeAmountNumeric,
    feeAmount: formatCurrency(feeAmountNumeric),
    feeLabel: feeItems.length === 1
      ? feeItems[0].label
      : feeItems.map((item) => item.shortLabel).join(' + '),
    feeCategory: [...new Set(feeItems.map((item) => item.category))].join(', ')
  };
};

/**
 * @pure
 * @param {Object} config
 * @param {Object|null} draft
 * @returns {Object|null}
 */
const normalizeRegistrationDraft = (config, draft) => {
  if (!draft) return null;

  if (draft.feeItems?.length) {
    return {
      ...draft,
      form: {
        ...draft.form,
        feeKeys: draft.feeKeys || draft.feeItems.map((item) => item.key)
      },
      ...summarizeFeeItems(draft.feeItems)
    };
  }

  const legacyKeys = draft.feeKeys || draft.form?.feeKeys || [];
  if (legacyKeys.length) {
    const summary = summarizeFeeItems(resolveFeeItems(config, legacyKeys));
    return {
      ...draft,
      ...summary,
      form: {
        ...draft.form,
        feeKeys: summary.feeKeys
      }
    };
  }

  return draft;
};

/**
 * @pure
 * @param {FormData|Object} source
 * @returns {Object}
 */
const parseRegistrationForm = (source) => {
  const read = (key) => String(source.get ? source.get(key) : source[key] || '').trim();
  const readFeeKeys = () => {
    if (source.getAll) {
      return [...new Set(source.getAll('feeKeys').map((key) => String(key).trim()).filter(Boolean))];
    }

    if (Array.isArray(source.feeKeys)) {
      return [...new Set(source.feeKeys.map((key) => String(key).trim()).filter(Boolean))];
    }

    if (source.feeKey) {
      return [String(source.feeKey).trim()].filter(Boolean);
    }

    return [];
  };

  return {
    name: read('name'),
    email: read('email'),
    phone: read('phone'),
    feeKeys: readFeeKeys(),
    usgaHandicap: read('usgaHandicap'),
    socialHandles: read('socialHandles'),
    scoreStatsLinks: read('scoreStatsLinks'),
    location: read('location'),
    homeCourse: read('homeCourse'),
    venmoHandle: read('venmoHandle').replace(/^@+/, ''),
    paymentConfirmed: read('paymentConfirmed') === 'on' || read('paymentConfirmed') === 'true'
  };
};

/**
 * @pure
 * @param {Object} form
 * @returns {Array}
 */
const validateRegistrationForm = (form) => {
  const errors = [];

  if (!form.name) errors.push('Name is required.');
  if (!form.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.push('A valid email is required.');
  if (!form.feeKeys.length) errors.push('Select at least one fee.');
  if (!form.usgaHandicap) errors.push('USGA handicap index is required.');
  if (!form.location) errors.push('Location is required.');
  if (!form.homeCourse) errors.push('Home course is required.');
  if (!form.venmoHandle) errors.push('Your Venmo handle is required so we are able to match your payment.');

  return errors;
};

/**
 * @pure
 * @param {String} value
 * @returns {String}
 */
const sanitizeVenmoNotePart = (value) => (
  String(value ?? '')
    .replace(/[\r\n\t|]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
);

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {Array}
 */
const buildVenmoNoteParts = (config, draft) => {
  const form = draft.form;
  const feeSummary = draft.feeItems.length === 1
    ? draft.feeItems[0].shortLabel
    : draft.feeItems.map((item) => `${item.shortLabel} ${item.amount}`).join(' + ');

  return [
    `${config.registration.invoicePrefix} ${draft.invoiceNumber} ${feeSummary}`,
    `Name: ${sanitizeVenmoNotePart(form.name)}`,
    `Email: ${sanitizeVenmoNotePart(form.email)}`,
    form.phone ? `Phone: ${sanitizeVenmoNotePart(form.phone)}` : '',
    `Venmo: @${sanitizeVenmoNotePart(form.venmoHandle)}`,
    `Location: ${sanitizeVenmoNotePart(form.location)}`,
    `Course: ${sanitizeVenmoNotePart(form.homeCourse)}`,
    `HCP: ${sanitizeVenmoNotePart(form.usgaHandicap)}`,
    form.socialHandles ? `Social: ${sanitizeVenmoNotePart(form.socialHandles)}` : '',
    form.scoreStatsLinks ? `Stats: ${sanitizeVenmoNotePart(form.scoreStatsLinks)}` : ''
  ].filter(Boolean);
};

/**
 * @pure
 * @param {Array} parts
 * @returns {String}
 */
const joinVenmoNoteParts = (parts) => parts.join(' | ');

/**
 * Venmo caps payment notes at 500 characters. Drop optional tail fields first,
 * then truncate while preserving the invoice reference at the start.
 * @pure
 * @param {Array} parts
 * @returns {String}
 */
const fitVenmoNoteLength = (parts) => {
  const workingParts = [...parts];
  let note = joinVenmoNoteParts(workingParts);

  while (note.length > VENMO_NOTE_MAX_LENGTH && workingParts.length > 1) {
    workingParts.pop();
    note = joinVenmoNoteParts(workingParts);
  }

  if (note.length <= VENMO_NOTE_MAX_LENGTH) {
    return note;
  }

  const invoiceLine = workingParts[0];
  const remaining = VENMO_NOTE_MAX_LENGTH - invoiceLine.length - 5;

  if (remaining <= 0) {
    return invoiceLine.slice(0, VENMO_NOTE_MAX_LENGTH);
  }

  const tail = joinVenmoNoteParts(workingParts.slice(1));
  return `${invoiceLine} | ${tail.slice(0, remaining)}…`;
};

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const buildVenmoNote = (config, draft) => (
  fitVenmoNoteLength(buildVenmoNoteParts(config, draft))
);

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const buildVenmoPaymentUrl = (config, draft) => (
  SiteConfig.buildVenmoPaymentUrl({
    recipient: config.payments.venmoRecipient,
    amountNumeric: draft.feeAmountNumeric,
    note: buildVenmoNote(config, draft)
  })
);

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const buildRegistrationInvoiceText = (config, draft) => {
  const registration = config.registration;
  const lines = [
    `${registration.organization}`,
    `${registration.eventName}`,
    `Invoice #: ${draft.invoiceNumber}`,
    `Invoice Date: ${formatInvoiceDate(new Date(draft.createdAt))}`,
    '',
    'PAYMENT DETAILS',
    ...draft.feeItems.flatMap((item) => [`${item.label}: ${item.amount}`]),
    `Total Due: ${draft.feeAmount}`,
    `Categories: ${draft.feeCategory}`,
    `Venmo Payee: @${config.payments.venmoRecipient}`,
    `Payer Venmo Handle: @${draft.form.venmoHandle}`,
    '',
    'REGISTRANT',
    `Name: ${draft.form.name}`,
    `Email: ${draft.form.email}`,
    `Phone: ${draft.form.phone || 'Not provided'}`,
    `Location: ${draft.form.location}`,
    `Home Course: ${draft.form.homeCourse}`,
    `USGA Handicap Index: ${draft.form.usgaHandicap}`,
    '',
    'OPTIONAL PROFILE',
    `Social Media: ${draft.form.socialHandles || 'Not provided'}`,
    `Score / Stats Links: ${draft.form.scoreStatsLinks || 'Not provided'}`,
    '',
    'PAYMENT STATUS',
    `Venmo note sent with payment: ${buildVenmoNote(config, draft)}`,
    `Payment confirmed by registrant: ${draft.form.paymentConfirmed ? 'Yes' : 'Pending confirmation'}`,
    '',
    `Event Dates: ${registration.eventDates}`,
    `Payee: ${registration.payeeName}`,
    `Contact: ${registration.payeeEmail} | ${registration.payeePhone}`
  ];

  return lines.join('\n');
};

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const buildRegistrationEmailLink = (config, draft) => (
  SiteConfig.buildMailtoLink({
    subject: `${draft.invoiceNumber} ${draft.feeAmount} - ${draft.form.name}`,
    body: [
      'Hello Ryan,',
      '',
      'Please find my Great Lakes Amateur registration invoice below. I completed Venmo payment using my registration details in the transaction note.',
      '',
      buildRegistrationInvoiceText(config, draft),
      '',
      'Thank you,',
      draft.form.name
    ].join('\n')
  })
);

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const buildRegistrationSmsLink = (config, draft) => (
  SiteConfig.buildSmsLink([
    `GLA Invoice ${draft.invoiceNumber}`,
    `${draft.form.name} paid ${draft.feeAmount} for ${draft.feeItems.map((item) => item.shortLabel).join(' + ')}.`,
    `Venmo: @${draft.form.venmoHandle}`,
    `Email: ${draft.form.email}`,
    `Handicap: ${draft.form.usgaHandicap}`,
    `Home Course: ${draft.form.homeCourse}`
  ].join(' '))
);

/**
 * @pure
 * @param {Object} config
 * @param {Object} draft
 * @returns {String}
 */
const createInvoicePreviewMarkup = (config, draft) => `
  <article class="c-registration-invoice">
    <header class="c-registration-invoice__header">
      <p class="c-registration-invoice__eyebrow">${escapeHtml(config.registration.organization)}</p>
      <h2 class="c-registration-invoice__title">Registration Invoice</h2>
      <p class="c-registration-invoice__meta">Invoice # <strong>${escapeHtml(draft.invoiceNumber)}</strong></p>
      <p class="c-registration-invoice__meta">Date: ${escapeHtml(formatInvoiceDate(new Date(draft.createdAt)))}</p>
    </header>

    <div class="c-registration-invoice__body">
      <section class="c-registration-invoice__section">
        <h3 class="c-registration-invoice__section-title">Payment</h3>
        <ul class="c-registration-invoice__line-items">
          ${draft.feeItems.map((item) => (
            `<li><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.amount)}</strong></li>`
          )).join('')}
        </ul>
        <p class="c-registration-invoice__amount">Total: ${escapeHtml(draft.feeAmount)}</p>
        <p>Venmo payee: <strong>@${escapeHtml(config.payments.venmoRecipient)}</strong></p>
        <p class="c-registration-invoice__venmo-note">Venmo note to include: <strong>${escapeHtml(buildVenmoNote(config, draft))}</strong></p>
      </section>

      <section class="c-registration-invoice__section">
        <h3 class="c-registration-invoice__section-title">Registrant</h3>
        <dl class="c-registration-invoice__list">
          <div><dt>Name</dt><dd>${escapeHtml(draft.form.name)}</dd></div>
          <div><dt>Email</dt><dd>${escapeHtml(draft.form.email)}</dd></div>
          <div><dt>Phone</dt><dd>${escapeHtml(draft.form.phone || 'Not provided')}</dd></div>
          <div><dt>Your Venmo</dt><dd>@${escapeHtml(draft.form.venmoHandle)}</dd></div>
          <div><dt>Location</dt><dd>${escapeHtml(draft.form.location)}</dd></div>
          <div><dt>Home Course</dt><dd>${escapeHtml(draft.form.homeCourse)}</dd></div>
          <div><dt>USGA Handicap</dt><dd>${escapeHtml(draft.form.usgaHandicap)}</dd></div>
          <div><dt>Social Media</dt><dd>${escapeHtml(draft.form.socialHandles || 'Not provided')}</dd></div>
          <div><dt>Score / Stats Links</dt><dd>${escapeHtml(draft.form.scoreStatsLinks || 'Not provided')}</dd></div>
        </dl>
      </section>
    </div>
  </article>
`;

/**
 * @pure
 * @param {Object} option
 * @returns {String}
 */
const formatFeeOptionSelectLabel = (option) => (
  `${option.amount} — ${option.shortLabel || option.label}`
);

/**
 * @pure
 * @param {Array} feeOptions
 * @param {Array} selectedKeys
 * @returns {String}
 */
const createFeeAddSelectMarkup = (feeOptions, selectedKeys = []) => {
  const groups = new Map();

  feeOptions.forEach((option) => {
    const category = option.category || 'Other';

    if (!groups.has(category)) {
      groups.set(category, []);
    }

    groups.get(category).push(option);
  });

  return [...groups.entries()].map(([category, options]) => (
    `<optgroup label="${escapeHtml(category)}">${options.map((option) => {
      const isSelected = selectedKeys.includes(option.key);
      return `<option value="${escapeHtml(option.key)}"${isSelected ? ' disabled' : ''} title="${escapeHtml(option.label)}">${escapeHtml(formatFeeOptionSelectLabel(option))}${isSelected ? ' (added)' : ''}</option>`;
    }).join('')}</optgroup>`
  )).join('');
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @param {Array} feeKeys
 * @returns {void}
 */
const syncFeeSelection = (config, root, feeKeys) => {
  const form = root.querySelector(REGISTRATION_FORM_SELECTOR);
  const feeAddSelect = root.querySelector('[data-registration-fee-add]');
  const selectedHost = root.querySelector('[data-registration-fee-selected]');
  const keysHost = root.querySelector('[data-registration-fee-keys-host]');
  const totalHost = root.querySelector('[data-registration-fee-total]');
  const feeItems = resolveFeeItems(config, feeKeys);
  const allOptions = SiteConfig.getRegistrationFeeOptions(config);

  if (feeAddSelect instanceof HTMLSelectElement) {
    feeAddSelect.innerHTML = `<option value="">Add a fee...</option>${createFeeAddSelectMarkup(allOptions, feeKeys)}`;
  }

  if (keysHost) {
    keysHost.innerHTML = feeKeys.map((key) => (
      `<input type="hidden" name="feeKeys" value="${escapeHtml(key)}">`
    )).join('');
  }

  if (selectedHost) {
    if (!feeItems.length) {
      selectedHost.hidden = true;
      selectedHost.innerHTML = '';
    } else {
      selectedHost.hidden = false;
      selectedHost.innerHTML = feeItems.map((item) => (
        `<li class="c-registration-form__fee-chip">
          <span class="c-registration-form__fee-chip-label" title="${escapeHtml(item.label)}">${escapeHtml(formatFeeOptionSelectLabel(item))}</span>
          <button type="button" class="c-registration-form__fee-chip-remove" data-registration-fee-remove="${escapeHtml(item.key)}" aria-label="Remove ${escapeHtml(item.shortLabel)}">&times;</button>
        </li>`
      )).join('');
    }
  }

  if (totalHost) {
    if (!feeItems.length) {
      totalHost.hidden = true;
      totalHost.textContent = '';
      return;
    }

    totalHost.hidden = false;
    totalHost.textContent = `Combined total: ${summarizeFeeItems(feeItems).feeAmount}`;
  }

  if (form) {
    form.dataset.selectedFeeCount = String(feeKeys.length);
  }
};

/**
 * @pure
 * @param {HTMLFormElement} form
 * @returns {Array}
 */
const getSelectedFeeKeysFromForm = (form) => (
  [...new Set([...form.querySelectorAll('input[name="feeKeys"]')].map((input) => input.value).filter(Boolean))]
);

/**
 * @effect
 * @param {Object} config
 * @returns {Object|null}
 */
const loadRegistrationDraft = (config) => {
  try {
    const raw = sessionStorage.getItem(config.registration.storageKey);
    return raw ? normalizeRegistrationDraft(config, JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

/**
 * @effect
 * @param {Object} config
 * @param {Object} draft
 * @returns {void}
 */
const saveRegistrationDraft = (config, draft) => {
  sessionStorage.setItem(config.registration.storageKey, JSON.stringify(draft));
};

/**
 * @effect
 * @param {Object} config
 * @returns {void}
 */
const clearRegistrationDraft = (config) => {
  sessionStorage.removeItem(config.registration.storageKey);
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {String} step
 * @returns {void}
 */
const showRegistrationStep = (root, step) => {
  root.dataset.registrationStep = step;
  root.querySelectorAll('[data-registration-step-panel]').forEach((panel) => {
    panel.hidden = panel.dataset.registrationStepPanel !== step;
  });

  root.querySelectorAll('[data-registration-step-label]').forEach((item) => {
    const label = item.dataset.registrationStepLabel;

    if (step === 'complete') {
      item.removeAttribute('aria-current');
      return;
    }

    if (label === step) {
      item.setAttribute('aria-current', 'step');
    } else {
      item.removeAttribute('aria-current');
    }
  });
};

/**
 * @effect
 * @param {HTMLElement} root
 * @param {Array} errors
 * @returns {void}
 */
const renderRegistrationErrors = (root, errors) => {
  const host = root.querySelector('[data-registration-errors]');
  if (!host) return;

  if (!errors.length) {
    host.hidden = true;
    host.removeAttribute('role');
    host.innerHTML = '';
    return;
  }

  host.hidden = false;
  host.setAttribute('role', 'alert');
  host.innerHTML = `<ul class="c-registration__errors">${errors.map((error) => `<li>${escapeHtml(error)}</li>`).join('')}</ul>`;
};

/**
 * @effect
 * @param {HTMLFormElement} form
 * @param {Object} draft
 * @returns {void}
 */
const populateRegistrationForm = (form, draft) => {
  if (!form || !draft?.form) return;

  const feeKeys = draft.feeKeys || draft.form?.feeKeys || [];

  Object.entries(draft.form).forEach(([key, value]) => {
    if (key === 'feeKeys') return;

    const field = form.elements.namedItem(key);
    if (!field) return;

    if (field instanceof RadioNodeList || field.type === 'checkbox') {
      field.checked = Boolean(value);
      return;
    }

    field.value = value;
  });

  form.querySelectorAll('input[name="feeKeys"]').forEach((input) => {
    input.remove();
  });
};

/**
 * @effect
 * @param {Object} config
 * @param {Object} draft
 * @returns {Object}
 */
const createDraftFromForm = (config, form) => {
  const formValues = parseRegistrationForm(new FormData(form));
  const feeItems = resolveFeeItems(config, formValues.feeKeys);

  if (!feeItems.length) {
    throw new Error('Select at least one fee.');
  }

  return {
    step: 'invoice',
    invoiceNumber: generateInvoiceNumber(config.registration),
    createdAt: new Date().toISOString(),
    venmoOpenedAt: null,
    sentAt: null,
    form: formValues,
    ...summarizeFeeItems(feeItems)
  };
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @param {Object} draft
 * @returns {void}
 */
const renderInvoiceStep = (config, root, draft) => {
  const preview = root.querySelector('[data-registration-invoice-preview]');
  const venmoLink = root.querySelector('[data-registration-venmo-link]');

  if (preview) {
    preview.innerHTML = createInvoicePreviewMarkup(config, draft);
  }

  if (venmoLink) {
    venmoLink.setAttribute('href', buildVenmoPaymentUrl(config, draft));
  }
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @param {Object} draft
 * @returns {void}
 */
const renderSendStep = (config, root, draft) => {
  const summary = root.querySelector('[data-registration-send-summary]');
  const emailLink = root.querySelector('[data-registration-email-link]');
  const smsLink = root.querySelector('[data-registration-sms-link]');
  const invoiceText = buildRegistrationInvoiceText(config, draft);

  if (summary) {
    summary.textContent = `Invoice ${draft.invoiceNumber} for ${draft.feeAmount} (${draft.feeLabel}). One Venmo payment covers all selected fees. Send the invoice by email or text when payment is complete.`;
  }

  if (emailLink) {
    emailLink.setAttribute('href', buildRegistrationEmailLink(config, draft));
  }

  if (smsLink) {
    smsLink.setAttribute('href', buildRegistrationSmsLink(config, draft));
  }

  root.dataset.invoiceText = invoiceText;
};

/**
 * @effect
 * @param {Object} config
 * @returns {Promise<Function>}
 */
const loadJsPdf = (config) => {
  const jspdfConfig = config.registration?.jspdf;
  const src = jspdfConfig?.url || 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
  const integrity = jspdfConfig?.integrity || '';

  return loadScript({
    src,
    integrity,
    datasetKey: 'jspdfScript',
    isReady: () => (window.jspdf?.jsPDF ? window.jspdf.jsPDF : null),
    readyLabel: 'jsPDF'
  });
};

/**
 * @effect
 * @param {Object} config
 * @param {Object} draft
 * @returns {Promise<void>}
 */
const downloadRegistrationInvoicePdf = async (config, draft) => {
  const jsPDF = await loadJsPdf(config);
  const doc = new jsPDF();
  const text = buildRegistrationInvoiceText(config, draft);
  const lines = doc.splitTextToSize(text, 180);

  doc.setFontSize(12);
  doc.text(lines, 14, 18);
  doc.save(`${draft.invoiceNumber}.pdf`);
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @param {Object|null} draft
 * @returns {void}
 */
const hydrateRegistrationView = (config, root, draft) => {
  const form = root.querySelector(REGISTRATION_FORM_SELECTOR);
  const normalizedDraft = normalizeRegistrationDraft(config, draft);
  const requestedFeeKeys = getHashQueryFeeKeys(config);
  const draftFeeKeys = normalizedDraft?.feeKeys || normalizedDraft?.form?.feeKeys || [];
  const selectedFeeKeys = requestedFeeKeys.length ? requestedFeeKeys : draftFeeKeys;
  const feeSelectionChanged = Boolean(
    requestedFeeKeys.length
    && normalizedDraft
    && (
      requestedFeeKeys.length !== draftFeeKeys.length
      || requestedFeeKeys.some((key) => !draftFeeKeys.includes(key))
    )
  );

  syncFeeSelection(config, root, selectedFeeKeys);

  if (normalizedDraft) {
    if (form) {
      populateRegistrationForm(form, {
        ...normalizedDraft,
        feeKeys: selectedFeeKeys,
        form: {
          ...normalizedDraft.form,
          feeKeys: selectedFeeKeys
        }
      });
      syncFeeSelection(config, root, selectedFeeKeys);
    }

    renderInvoiceStep(config, root, normalizedDraft);
    renderSendStep(config, root, normalizedDraft);
    showRegistrationStep(root, feeSelectionChanged ? 'details' : normalizedDraft.step);
    return;
  }

  showRegistrationStep(root, 'details');
};

/**
 * @effect
 * @param {Object} config
 * @param {HTMLElement} root
 * @returns {void}
 */
const bindRegistrationInteractions = (config, root) => {
  if (runtime.boundRoot === root) return;

  unbindRegistrationInteractions();

  runtime.boundRoot = root;
  runtime.clickHandler = async (event) => {
    const form = root.querySelector(REGISTRATION_FORM_SELECTOR);
    if (!form) return;

    if (event.target.closest('[data-registration-action="continue"]')) {
      event.preventDefault();
      const formValues = parseRegistrationForm(new FormData(form));
      const errors = validateRegistrationForm(formValues);
      renderRegistrationErrors(root, errors);
      if (errors.length) return;

      try {
        const draft = createDraftFromForm(config, form);
        saveRegistrationDraft(config, draft);
        renderInvoiceStep(config, root, draft);
        renderSendStep(config, root, draft);
        showRegistrationStep(root, 'invoice');
      } catch (error) {
        renderRegistrationErrors(root, [error.message]);
      }
      return;
    }

    if (event.target.closest('[data-registration-action="open-venmo"]')) {
      event.preventDefault();
      const draft = loadRegistrationDraft(config);
      if (!draft) return;

      draft.step = 'send';
      draft.venmoOpenedAt = new Date().toISOString();
      saveRegistrationDraft(config, draft);
      renderSendStep(config, root, draft);
      showRegistrationStep(root, 'send');
      window.open(buildVenmoPaymentUrl(config, draft), '_blank', 'noopener,noreferrer');
      return;
    }

    if (event.target.closest('[data-registration-action="back-details"]')) {
      event.preventDefault();
      showRegistrationStep(root, 'details');
      return;
    }

    if (event.target.closest('[data-registration-action="download-invoice"]')) {
      event.preventDefault();
      const draft = loadRegistrationDraft(config);
      if (!draft) return;
      downloadRegistrationInvoicePdf(config, draft).catch((error) => {
        window.alert('Unable to download the invoice PDF. The email and text options still include the full invoice details.');
        console.warn('[RegistrationInvoice]', error);
      });
      return;
    }

    if (event.target.closest('[data-registration-action="complete"]')) {
      event.preventDefault();
      clearRegistrationDraft(config);
      form.reset();
      syncFeeSelection(config, root, []);
      showRegistrationStep(root, 'complete');
      return;
    }

    const feeRemove = event.target.closest('[data-registration-fee-remove]');
    if (feeRemove) {
      event.preventDefault();
      const key = feeRemove.getAttribute('data-registration-fee-remove');
      syncFeeSelection(
        config,
        root,
        getSelectedFeeKeysFromForm(form).filter((feeKey) => feeKey !== key)
      );
    }
  };

  runtime.changeHandler = (event) => {
    const currentForm = root.querySelector(REGISTRATION_FORM_SELECTOR);

    if (event.target.matches('[data-registration-fee-add]') && currentForm) {
      const feeKey = event.target.value;
      if (!feeKey) return;

      const selectedKeys = getSelectedFeeKeysFromForm(currentForm);
      if (!selectedKeys.includes(feeKey)) {
        syncFeeSelection(config, root, [...selectedKeys, feeKey]);
      }

      event.target.value = '';
      return;
    }

    if (event.target.name === 'paymentConfirmed') {
      const draft = loadRegistrationDraft(config);
      if (!draft) return;
      draft.form.paymentConfirmed = event.target.checked;
      saveRegistrationDraft(config, draft);
      renderSendStep(config, root, draft);
    }
  };

  root.addEventListener('click', runtime.clickHandler);
  root.addEventListener('change', runtime.changeHandler);
};

/**
 * @effect
 * @returns {void}
 */
const unbindRegistrationInteractions = () => {
  if (!runtime.boundRoot) return;

  runtime.boundRoot.removeEventListener('click', runtime.clickHandler);
  runtime.boundRoot.removeEventListener('change', runtime.changeHandler);
  runtime.boundRoot = null;
  runtime.clickHandler = null;
  runtime.changeHandler = null;
};

/**
 * @effect
 * @param {Object} config
 * @param {String} routePath
 * @returns {void}
 */
export const initRegistrationForm = (config, routePath) => {
  if (!shouldRenderRegistrationForm(config, routePath)) {
    unbindRegistrationInteractions();
    return;
  }

  const root = document.querySelector(REGISTRATION_ROOT_SELECTOR);
  if (!root) return;

  const draft = loadRegistrationDraft(config);
  hydrateRegistrationView(config, root, draft);
  bindRegistrationInteractions(config, root);
};
