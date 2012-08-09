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

  var formatter = NativeJSCreateNumberFormat(locale.locale + extension,
                                             internalOptions);

  // We can't get information about number or currency style from ICU, so we
  // assume user request was fulfilled.
  formatter.style = internalOptions.style;
  if (internalOptions.style === 'currency') {
    formatter.currencyDisplay = currencyDisplay;
  }

  Object.defineProperty(numberFormat, 'formatter', {value: formatter});

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
  return {
    locale: format.formatter.locale,
    numberingSystem: format.formatter.numberingSystem,
    style: format.formatter.style,
    currency: format.formatter.currency,
    currencyDisplay: format.formatter.currencyDisplay,
    useGrouping: format.formatter.useGrouping,
    minimumIntegerDigits: format.formatter.minimumIntegerDigits,
    minimumFractionDigits: format.formatter.minimumFractionDigits,
    maximumFractionDigits: format.formatter.maximumFractionDigits,
    minimumSignificantDigits: format.formatter.minimumSignificantDigits,
    maximumSignificantDigits: format.formatter.maximumSignificantDigits
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
v8Intl.NumberFormat.supportedLocalesOf = function(locales) {
  var options = arguments.length >= 2 ? arguments[1] : undefined;
  return supportedLocalesOf('numberformat', locales, options);
};


/**
 * Returns a String value representing the result of calling ToNumber(value)
 * according to the effective locale and the formatting options of this
 * NumberFormat.
 */
function formatNumber(formatter, value) {
  native function NativeJSInternalNumberFormat();

  return NativeJSInternalNumberFormat(formatter.formatter, Number(value));
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
