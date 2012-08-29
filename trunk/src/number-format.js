// Copyright 2012 the v8-i18n authors.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// ECMAScript 402 API implementation is broken into separate files for
// each service. The build system combines them together into one
// Intl namespace.

/**
 * Verifies that the input is a well-formed ISO 4217 currency code.
 */
function isWellFormedCurrencyCode(currency) {
  if (typeof currency !== "string") {
    return false;
  }

  var code = String(currency);
  if (code.length !== 3) {
    return false;
  }

  // Don't uppercase to test. It could convert invalid code into a valid one.
  // For example \u00DFP (Eszett+P) becomes SSP.
  if (code.match(/[^A-Za-z]/) !== null) {
    return false;
  }

  return true;
}


/**
 * Initializes the given object so it's a valid NumberFormat instance.
 * Useful for subclassing.
 */
function initializeNumberFormat(numberFormat, locales, options) {
  native function NativeJSCreateNumberFormat();

  if (numberFormat.hasOwnProperty('__initializedIntlObject')) {
    throw new TypeError('Trying to re-initialize NumberFormat object.');
  }

  if (options === undefined) {
    options = {};
  }

  var getOption = getGetOption(options, 'numberformat');

  var locale = resolveLocale('numberformat', locales, options);

  var internalOptions = {};
  internalOptions.style = getOption(
      'style', 'string', ['decimal', 'percent', 'currency'], 'decimal');

  var currency = getOption('currency', 'string');
  if (currency && !isWellFormedCurrencyCode(currency)) {
    throw new RangeError('Invalid currency code: ' + currency);
  }

  if (internalOptions.style === 'currency' && currency === undefined) {
    throw new TypeError('Currency code is required with currency style.');
  }

  var currencyDisplay = getOption(
      'currencyDisplay', 'string', ['code', 'symbol', 'name'], 'symbol');
  if (internalOptions.style === 'currency') {
    internalOptions.currency = currency.toUpperCase();
    internalOptions.currencyDisplay = currencyDisplay;
  }

  var digitRanges = ['minimumIntegerDigits', 'minimumFractionDigits',
                     'maximumFractionDigits', 'minimumSignificantDigits',
                     'maximumSignificantDigits'];
  for (var i = 0; i < digitRanges.length; ++i) {
    var digits = options[digitRanges[i]];
    if (digits !== undefined && (digits >= 0 && digits <= 21)) {
      internalOptions[digitRanges[i]] = Number(digits);
    }
  }

  internalOptions.useGrouping = getOption(
      'useGrouping', 'boolean', undefined, true);

  // ICU prefers options to be passed using -u- extension key/values for
  // number format, so we need to build that.
  var extensionMap = parseExtension(locale.extension);
  var extension = setOptions(options, extensionMap, NUMBER_FORMAT_KEY_MAP,
                             getOption, internalOptions);

  var requestedLocale = locale.locale + extension;
  var resolved = Object.defineProperties({}, {
    requestedLocale: {value: requestedLocale, writable: true},
    style: {value: internalOptions.style, writable: true},
    locale: {writable: true},
    numberingSystem: {writable: true},
    style: {writable: true},
    currency: {writable: true},
    currencyDisplay: {writable: true},
    useGrouping: {writable: true},
    minimumIntegerDigits: {writable: true},
    minimumFractionDigits: {writable: true},
    maximumFractionDigits: {writable: true},
    minimumSignificantDigits: {writable: true},
    maximumSignificantDigits: {writable: true}
  });

  var formatter = NativeJSCreateNumberFormat(requestedLocale,
                                             internalOptions,
                                             resolved);

  // We can't get information about number or currency style from ICU, so we
  // assume user request was fulfilled.
  if (internalOptions.style === 'currency') {
    Object.defineProperty(resolved, 'currencyDisplay', {value: currencyDisplay,
                                                        writable: true});
  }

  Object.defineProperty(numberFormat, 'formatter', {value: formatter});
  Object.defineProperty(numberFormat, 'resolved', {value: resolved});
  Object.defineProperty(numberFormat, '__initializedIntlObject',
                        {value: 'numberformat'});

  return numberFormat;
}


/**
 * Implements Intl.NumberFormat constructor.
 */
function numberConstructor() {
  var locales = arguments[0];
  var options = arguments[1];

  if (!this || this === v8Intl) {
    // Constructor is called as a function.
    return new v8Intl.NumberFormat(locales, options);
  }

  return initializeNumberFormat(toObject(this), locales, options);
}


/**
 * Constructs v8Intl.NumberFormat object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Object.defineProperty(v8Intl, 'NumberFormat', {value: numberConstructor,
	                                       writable: true,
	                                       enumerable: false,
                                               configurable: true});


/**
 * NumberFormat resolvedOptions method.
 */
function resolvedNumberOptions(format) {
  var locale = getOptimalLanguageTag(format.resolved.requestedLocale,
                                     format.resolved.locale);

  return {
    locale: locale,
    numberingSystem: format.resolved.numberingSystem,
    style: format.resolved.style,
    currency: format.resolved.currency,
    currencyDisplay: format.resolved.currencyDisplay,
    useGrouping: format.resolved.useGrouping,
    minimumIntegerDigits: format.resolved.minimumIntegerDigits,
    minimumFractionDigits: format.resolved.minimumFractionDigits,
    maximumFractionDigits: format.resolved.maximumFractionDigits,
    minimumSignificantDigits: format.resolved.minimumSignificantDigits,
    maximumSignificantDigits: format.resolved.maximumSignificantDigits
  };
};


addBoundMethod(v8Intl.NumberFormat, 'resolvedOptions',
	       resolvedNumberOptions, 0);


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 * Optional options parameter is hidden in order to satisfy the spec and tests.
 */
addSupportedLocalesOf('numberformat', v8Intl.NumberFormat);


/**
 * Returns a String value representing the result of calling ToNumber(value)
 * according to the effective locale and the formatting options of this
 * NumberFormat.
 */
function formatNumber(formatter, value) {
  native function NativeJSInternalNumberFormat();

  // Spec treats -0 and +0 as 0.
  var number = Number(value);
  if (number === -0) {
    number = 0;
  }

  return NativeJSInternalNumberFormat(formatter.formatter, number);
}


/**
 * Returns a Number that represents string value that was passed in.
 */
function parseNumber(formatter, value) {
  native function NativeJSInternalNumberParse();

  return NativeJSInternalNumberParse(formatter.formatter, String(value));
}


addBoundMethod(v8Intl.NumberFormat, 'format', formatNumber, 1);
addBoundMethod(v8Intl.NumberFormat, 'parse', parseNumber, 1);
