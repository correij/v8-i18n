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

/**
 * Intl object is a single object that has some named properties,
 * all of which are constructors.
 */
var Intl = (function() {

var Intl = {};

/**
 * Global native (C++) methods.
 */
native function NativeJSAvailableLocalesOf();

/**
 * List of available services.
 */
var AVAILABLE_SERVICES = ['collator', 'numberformat', 'dateformat'];

/**
 * Caches available locales for each service.
 */
var AVAILABLE_LOCALES = {
  'collator': undefined,
  'numberformat': undefined,
  'dateformat': undefined
}

/**
 * Global default locale, set by LocaleList constructor.
 */
var CURRENT_HOST_LOCALE = undefined;

/**
 * Unicode extension regular expression.
 */
var UNICODE_EXTENSION_RE = new RegExp('-u(-[a-z0-9]{2,8})+', 'g');

/**
 * Matchess any Unicode extension.
 */
var ANY_EXTENSION_RE = new RegExp('-[a-z0-9]{1}-.*', 'g');

/**
 * Replace quoted text (single quote, anything but the quote and quote again).
 */
var QUOTED_STRING_RE = new RegExp("'[^']+'", 'g');

/**
 * Maps ICU calendar names into LDML type.
 */
var ICU_CALENDAR_MAP = {
  'gregorian': 'gregory',
  'japanese': 'japanese',
  'buddhist': 'buddhist',
  'roc': 'roc',
  'persian': 'persian',
  'islamic-civil': 'islamicc',
  'islamic': 'islamic',
  'hebrew': 'hebrew',
  'chinese': 'chinese',
  'indian': 'indian',
  'coptic': 'coptic',
  'ethiopic': 'ethiopic',
  'ethiopic-amete-alem': 'ethioaa'
};


/**
 * Initializes the given object so it's a valid LocaleList instance.
 * Useful for subclassing.
 */
function initializeLocaleList(localeList, locales) {
  native function NativeJSCanonicalizeLanguageTag();

  // Invoke it here to cover all initialization paths.
  CURRENT_HOST_LOCALE = defaultLocale();

  var seen = [];
  if (locales === undefined) {
    // Constructor is called without arguments.
    seen = [CURRENT_HOST_LOCALE];
  } else {
    var o = toObject(locales);
    // Converts it to UInt32 (>>> is shr on 32bit integers).
    var len = o.length >>> 0;

    for (var k = 0; k < len; k++) {
      if (k in o) {
        var value = o[k];

        if (typeof value !== 'string' && typeof value !== 'object') {
          throw new TypeError('Invalid element in locales argument.');
        }

        var languageID = String(value);
        // This call will strip -kn but not -kn-true extensions.
        // ICU bug filled - http://bugs.icu-project.org/trac/ticket/9265.
        // TODO(cira): check if -u-kn-true-kc-true-kh-true still throws after
        // upgrade to ICU 4.9.
        var tag = NativeJSCanonicalizeLanguageTag(languageID);
        if (tag === 'invalid-tag') {
          throw new RangeError('Invalid language tag: ' + value);
        }

        if (seen.indexOf(tag) === -1) {
          seen.push(tag);
        }
      }
    }
  }

  for (var index = 0; index < seen.length; index++) {
    Object.defineProperty(localeList, String(index),
                          {value: seen[index],
                           writable: false,
                           enumerable: true,
                           configurable: false});
  }

  Object.defineProperty(localeList, 'length', {value: index,
                                               writable: false,
                                               enumerable: false,
                                               configurable: false});

  return localeList;
}


/**
 * Constructs Intl.LocaleList object given optional locales parameter.
 * Validates the elements as well-formed language tags and omits duplicates.
 *
 * @constructor
 */
Intl.LocaleList = function(locales) {
  if (!this || this === Intl) {
    // Constructor is called as a function.
    return new Intl.LocaleList(locales);
  }

  return initializeLocaleList(toObject(this), locales);
};


/**
 * LocaleList prototype object.
 */
Object.defineProperty(Intl.LocaleList,
                      'prototype',
                      { value: new Intl.LocaleList(),
                        writable: false,
                        enumerable: false,
                        configurable: false });


/**
 * Populates internalOptions object with boolean key-value pairs
 * from extensionMap.
 */
function extractBooleanOption(extensionMap, key, property, internalOptions) {
  if (extensionMap.hasOwnProperty(key)) {
    if (extensionMap[key] === 'false') {
      internalOptions[property] = false;
    } else {
      internalOptions[property] = true;
    }
  }
}


/**
 * Initializes the given object so it's a valid Collator instance.
 * Useful for subclassing.
 */
function initializeCollator(collator, locales, options) {
  native function NativeJSCreateCollator();

  if (options === undefined) {
    options = {};
  }

  var getOption = getGetOption(options, 'collator');

  var internalOptions = {};

  internalOptions.usage =
      getOption('usage', 'string', ['sort', 'search'], 'sort');

  internalOptions.sensitivity =
      getOption('sensitivity', 'string', ['base', 'accent', 'case', 'variant']);
  if (internalOptions.sensitivity === undefined &&
      internalOptions.usage === 'sort') {
    internalOptions.sensitivity = 'variant';
  }

  internalOptions.ignorePunctuation =
      getOption('ignorePunctuation', 'boolean', undefined, false);

  var locale = resolveLocale('collator', locales, options);

  // ICU can't take kb, kc... parameters through localeID, so we need to pass
  // them as options.
  // One exception is -co- which has to be part of the extension, but only for
  // usage: sort, and its value can't be 'standard' or 'search'.
  var extensionMap = parseExtension(locale.extension);

  extractBooleanOption(extensionMap, 'kb', 'backwards', internalOptions);
  extractBooleanOption(extensionMap, 'kc', 'caseLevel', internalOptions);
  extractBooleanOption(extensionMap, 'kn', 'numeric', internalOptions);
  extractBooleanOption(
      extensionMap, 'kh', 'hiraganaQuaternary', internalOptions);
  extractBooleanOption(extensionMap, 'kk', 'normalization', internalOptions);

  if (extensionMap.hasOwnProperty('kf')) {
    internalOptions.caseFirst = 'false';
    if (extensionMap.kf === 'upper') {
      internalOptions.caseFirst = 'upper';
    } else if (extensionMap.kf === 'lower') {
      internalOptions.caseFirst = 'lower';
    }
  }

  internalOptions.collation = 'default';
  var extension = '';
  if (extensionMap.hasOwnProperty('co') && internalOptions.usage === 'sort') {
    if (extensionMap.co &&
        extensionMap.co !== 'standard' && extensionMap.co !== 'search') {
      extension = '-u-co-' + extensionMap.co;
      // ICU can't tell us what the collation is, so save user's input.
      internalOptions.collation = extensionMap.co;
    }
  } else if (internalOptions.usage === 'search') {
    extension = '-u-co-search';
  }

  collator.__collator__ = NativeJSCreateCollator(locale.locale + extension,
                                                 internalOptions);
  collator.__collator__.locale = locale.locale;
  collator.__collator__.usage = internalOptions.usage;
  collator.__collator__.collation = internalOptions.collation;

  return collator;
}


/**
 * Constructs Intl.Collator object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.Collator = function(locales, options) {
  if (!this || this === Intl) {
    // Constructor is called as a function.
    return new Intl.Collator(locales, options);
  }

  return initializeCollator(toObject(this), locales, options);
};


/**
 * Collator prototype object.
 */
Object.defineProperty(Intl.Collator,
                      'prototype',
                      { value: new Intl.Collator(),
                        writable: false,
                        enumerable: false,
                        configurable: false });


/**
 * Collator resolvedOptions getter.
 */
Object.defineProperty(Intl.Collator.prototype, 'resolvedOptions', {
  get: function() {
    return {
      locale: this.__collator__.locale,
      usage: this.__collator__.usage,
      sensitivity: this.__collator__.sensitivity,
      ignorePunctuation: this.__collator__.ignorePunctuation,
      backwards: this.__collator__.backwards,
      caseLevel: this.__collator__.caseLevel,
      numeric: this.__collator__.numeric,
      hiraganaQuaternary: this.__collator__.hiraganaQuaternary,
      normalization: this.__collator__.normalization,
      caseFirst: this.__collator__.caseFirst,
      collation: this.__collator__.collation
    };
  },
  enumerable: false,
  configurable: true
});


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 */
Intl.Collator.supportedLocalesOf = function(locales, options) {
  return supportedLocalesOf('collator', locales, options);
};


/**
 * When the compare method is called with two arguments x and y, it returns a
 * Number other than NaN that represents the result of a locale-sensitive
 * String comparison of x with y.
 * The result is intended to order String values in the sort order specified
 * by the effective locale and collation options computed during construction
 * of this Collator object, and will be negative, zero, or positive, depending
 * on whether x comes before y in the sort order, the Strings are equal under
 * the sort order, or x comes after y in the sort order, respectively.
 */
function compare(collator, x, y) {
  return collator.__collator__.internalCompare(String(x), String(y));
};


Object.defineProperty(Intl.Collator.prototype, 'compare', {
 get: function() {
      if (this.__boundCompare__ === undefined) {
        var that = this;
        var boundCompare = function(x, y) {
          return compare(that, x, y);
        }
        this.__boundCompare__ = boundCompare;
      }
      return this.__boundCompare__;
    },
 enumerable: false,
 configurable: true
});


/**
 * Verifies that the input is a well-formed ISO 4217 currency code.
 */
function isWellFormedCurrencyCode(currency) {
  if (typeof currency !== "string") {
    return false;
  }

  var code = String(currency).toUpperCase();
  if (code.length !== 3) {
    return false;
  }

  if (code.match(/[^A-Z]/) !== null) {
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

  // ICU prefers options to be passed using -u- extension key/values, so
  // we need to build that. Update the options too with proper values.
  var extension = updateExtensionAndOptions(options, locale.extension,
                                            ['nu'], ['numberingSystem']);

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

  var formatter = NativeJSCreateNumberFormat(locale.locale + extension,
                                             internalOptions);

  formatter.locale = locale.locale;

  // We can't get information about number or currency style from ICU, so we
  // assume user request was fulfilled.
  formatter.style = internalOptions.style;
  if (internalOptions.style === 'currency') {
    formatter.currencyDisplay = currencyDisplay;
  }

  numberFormat.__formatter__ = formatter;

  return numberFormat;
}


/**
 * Constructs Intl.NumberFormat object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.NumberFormat = function(locales, options) {
  if (!this || this === Intl) {
    // Constructor is called as a function.
    return new Intl.NumberFormat(locales, options);
  }

  return initializeNumberFormat(toObject(this), locales, options);
};


/**
 * NumberFormat prototype object.
 */
Object.defineProperty(Intl.NumberFormat,
                      'prototype',
                      { value: new Intl.NumberFormat(),
                        writable: false,
                        enumerable: false,
                        configurable: false });


/**
 * NumberFormat resolvedOptions getter.
 */
Object.defineProperty(Intl.NumberFormat.prototype, 'resolvedOptions', {
  get: function() {
    return {
      locale: this.__formatter__.locale,
      numberingSystem: this.__formatter__.numberingSystem,
      style: this.__formatter__.style,
      currency: this.__formatter__.currency,
      currencyDisplay: this.__formatter__.currencyDisplay,
      useGrouping: this.__formatter__.useGrouping,
      minimumIntegerDigits: this.__formatter__.minimumIntegerDigits,
      minimumFractionDigits: this.__formatter__.minimumFractionDigits,
      maximumFractionDigits: this.__formatter__.maximumFractionDigits,
      minimumSignificantDigits: this.__formatter__.minimumSignificantDigits,
      maximumSignificantDigits: this.__formatter__.maximumSignificantDigits
    };
  },
  enumerable: false,
  configurable: true
});


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 */
Intl.NumberFormat.supportedLocalesOf = function(locales, options) {
  return supportedLocalesOf('numberformat', locales, options);
};


/**
 * Returns a String value representing the result of calling ToNumber(value)
 * according to the effective locale and the formatting options of this
 * NumberFormat.
 */
Intl.NumberFormat.prototype.format = function (value) {
  return this.__formatter__.internalFormat(Number(value));
};


/**
 * Returns a string that matches LDML representation of the options object.
 */
function toLDMLString(options) {
  var getOption = getGetOption(options, 'dateformat');

  var ldmlString = '';

  var option = getOption('weekday', 'string', ['narrow', 'short', 'long']);
  ldmlString += appendToLDMLString(
      option, {narrow: 'EEEEE', short: 'EEE', long: 'EEEE'});

  option = getOption('era', 'string', ['narrow', 'short', 'long']);
  ldmlString += appendToLDMLString(
      option, {narrow: 'GGGGG', short: 'GGG', long: 'GGGG'});

  option = getOption('year', 'string', ['2-digit', 'numeric']);
  ldmlString += appendToLDMLString(option, {'2-digit': 'yy', 'numeric': 'y'});

  option = getOption('month', 'string',
                     ['2-digit', 'numeric', 'narrow', 'short', 'long']);
  ldmlString += appendToLDMLString(option, {'2-digit': 'MM', 'numeric': 'M',
          'narrow': 'MMMMM', 'short': 'MMM', 'long': 'MMMM'});

  option = getOption('day', 'string', ['2-digit', 'numeric']);
  ldmlString += appendToLDMLString(
      option, {'2-digit': 'dd', 'numeric': 'd'});

  var hr12 = getOption('hour12', 'boolean');
  option = getOption('hour', 'string', ['2-digit', 'numeric']);
  if (hr12 === undefined) {
    ldmlString += appendToLDMLString(option, {'2-digit': 'jj', 'numeric': 'j'});
  } else if (hr12 === true) {
    ldmlString += appendToLDMLString(option, {'2-digit': 'hh', 'numeric': 'h'});
  } else {
    ldmlString += appendToLDMLString(option, {'2-digit': 'HH', 'numeric': 'H'});
  }

  option = getOption('minute', 'string', ['2-digit', 'numeric']);
  ldmlString += appendToLDMLString(option, {'2-digit': 'mm', 'numeric': 'm'});

  option = getOption('second', 'string', ['2-digit', 'numeric']);
  ldmlString += appendToLDMLString(option, {'2-digit': 'ss', 'numeric': 's'});

  option = getOption('timeZoneName', 'string', ['short', 'long']);
  ldmlString += appendToLDMLString(option, {short: 'v', long: 'vv'});

  return ldmlString;
}


/**
 * Returns either LDML equivalent of the current option or empty string.
 */
function appendToLDMLString(option, pairs) {
  if (option !== undefined) {
    return pairs[option];
  } else {
    return '';
  }
}


/**
 * Returns object that matches LDML representation of the date.
 */
function fromLDMLString(ldmlString) {
  // First remove '' quoted text, so we lose 'Uhr' strings.
  ldmlString = ldmlString.replace(QUOTED_STRING_RE, '');

  var options = {};
  var match = ldmlString.match(/E{3,5}/g);
  options = appendToDateTimeObject(
      options, 'weekday', match, {EEEEE: 'narrow', EEE: 'short', EEEE: 'long'});

  match = ldmlString.match(/G{3,5}/g);
  options = appendToDateTimeObject(
      options, 'era', match, {GGGGG: 'narrow', GGG: 'short', GGGG: 'long'});

  match = ldmlString.match(/y{1,2}/g);
  options = appendToDateTimeObject(
      options, 'year', match, {y: 'numeric', yy: '2-digit'});

  match = ldmlString.match(/M{1,5}/g);
  options = appendToDateTimeObject(options, 'month', match, {MM: '2-digit',
      M: 'numeric', MMMMM: 'narrow', MMM: 'short', MMMM: 'long'});

  // Sometimes we get L instead of M for month - standalone name.
  match = ldmlString.match(/L{1,5}/g);
  options = appendToDateTimeObject(options, 'month', match, {LL: '2-digit',
      L: 'numeric', LLLLL: 'narrow', LLL: 'short', LLLL: 'long'});

  match = ldmlString.match(/d{1,2}/g);
  options = appendToDateTimeObject(
      options, 'day', match, {d: 'numeric', dd: '2-digit'});

  match = ldmlString.match(/h{1,2}/g);
  if (match !== null) {
    options['hour12'] = true;
  }
  options = appendToDateTimeObject(
      options, 'hour', match, {h: 'numeric', hh: '2-digit'});

  match = ldmlString.match(/H{1,2}/g);
  if (match !== null) {
    options['hour12'] = false;
  }
  options = appendToDateTimeObject(
      options, 'hour', match, {H: 'numeric', HH: '2-digit'});

  match = ldmlString.match(/m{1,2}/g);
  options = appendToDateTimeObject(
      options, 'minute', match, {m: 'numeric', mm: '2-digit'});

  match = ldmlString.match(/s{1,2}/g);
  options = appendToDateTimeObject(
      options, 'second', match, {s: 'numeric', ss: '2-digit'});

  match = ldmlString.match(/v{1,2}/g);
  options = appendToDateTimeObject(
      options, 'timeZoneName', match, {v: 'short', vv: 'long'});

  return options;
}


function appendToDateTimeObject(options, option, match, pairs) {
  if (match === null) {
    if (!options.hasOwnProperty(option)) {
      options[option] = undefined;
    }
    return options;
  }

  var property = match[0];
  options[option] = pairs[property];

  return options;
}


/**
 * Returns options with at least default values in it.
 */
function toDateTimeOptions(options, required, defaults) {
  if (options === undefined) {
    options = null;
  } else {
    options = toObject(options);
  }

  options = Object.apply(this, [options]);

  var needsDefault = true;
  if ((required === 'date' || required === 'all') &&
      (options.weekday !== undefined || options.year !== undefined ||
       options.month !== undefined || options.day !== undefined)) {
    needsDefault = false;
  }

  if ((required === 'time' || required === 'all') &&
      (options.hour !== undefined || options.minute !== undefined ||
       options.second !== undefined)) {
    needsDefault = false;
  }

  if (needsDefault && (defaults === 'date' || defaults === 'all')) {
    Object.defineProperty(options, 'year', {value: 'numeric',
                                            writable: true,
                                            enumerable: true,
                                            configurable: true});
    Object.defineProperty(options, 'month', {value: 'numeric',
                                             writable: true,
                                             enumerable: true,
                                             configurable: true});
    Object.defineProperty(options, 'day', {value: 'numeric',
                                           writable: true,
                                           enumerable: true,
                                           configurable: true});
  }

  if (needsDefault && (defaults === 'time' || defaults === 'all')) {
    Object.defineProperty(options, 'hour', {value: 'numeric',
                                            writable: true,
                                            enumerable: true,
                                            configurable: true});
    Object.defineProperty(options, 'minute', {value: 'numeric',
                                              writable: true,
                                              enumerable: true,
                                              configurable: true});
    Object.defineProperty(options, 'second', {value: 'numeric',
                                              writable: true,
                                              enumerable: true,
                                              configurable: true});
  }

  return options;
}


/**
 * Initializes the given object so it's a valid DateTimeFormat instance.
 * Useful for subclassing.
 */
function initializeDateTimeFormat(dateFormat, locales, options) {
  native function NativeJSCreateDateTimeFormat();

  if (options === undefined) {
    options = {};
  }

  options = toDateTimeOptions(options, 'all', 'date');

  var locale = resolveLocale('dateformat', locales, options);

  // Build LDML string for the skeleton that we pass to the formatter.
  var ldmlString = toLDMLString(options);

  // Filter out supported extension keys so we know what to put in resolved
  // section later on.
  // We need to pass calendar and number system to the method.
  var tz = options.timeZone;
  if (tz !== undefined) {
    tz = String(tz).toUpperCase();
    if (tz !== "UTC") {
      throw new RangeError("Invalid time zone specified: " + tz);
    }
  }

  // ICU prefers options to be passed using -u- extension key/values, so
  // we need to build that. Update the options too with proper values.
  var extension = updateExtensionAndOptions(options, locale.extension,
                                            ['ca', 'nu'],
                                            ['calendar', 'numberingSystem']);

  var getOption = getGetOption(options, 'dateformat');

  // We implement only best fit algorithm, but still need to check
  // if the formatMatch values are in range.
  var matcher = getOption('formatMatch', 'string',
                          ['basic', 'best fit'], 'best fit');

  var formatter = NativeJSCreateDateTimeFormat(
      locale.locale + extension, {skeleton: ldmlString, timeZone: tz});

  formatter.locale = locale.locale;
  formatter.tz = tz;
  dateFormat.__formatter__ = formatter;

  return dateFormat;
}


/**
 * Constructs Intl.DateTimeFormat object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.DateTimeFormat = function(locales, options) {
  if (!this || this === Intl) {
    // Constructor is called as a function.
    return new Intl.DateTimeFormat(locales, options);
  }

  return initializeDateTimeFormat(toObject(this), locales, options);
};


/**
 * DateTimeFormat prototype object.
 */
Object.defineProperty(Intl.DateTimeFormat,
                      'prototype',
                      { value: new Intl.DateTimeFormat(),
                        writable: false,
                        enumerable: false,
                        configurable: false });


/**
 * DateTimeFormat resolvedOptions getter.
 */
Object.defineProperty(Intl.DateTimeFormat.prototype, 'resolvedOptions', {
  get: function() {
    var fromPattern = fromLDMLString(this.__formatter__.pattern);
    var userCalendar = ICU_CALENDAR_MAP[this.__formatter__.calendar];
    if (userCalendar === undefined) {
      // Use ICU name if we don't have a match. It shouldn't happen, but
      // it would be too strict to throw for this.
      userCalendar = this.__formatter__.calendar;
    }

    return {
      locale: this.__formatter__.locale,
      numberingSystem: this.__formatter__.numberingSystem,
      calendar: userCalendar,
      timeZone: this.__formatter__.tz,
      timeZoneName: fromPattern.timeZoneName,
      era: fromPattern.era,
      year: fromPattern.year,
      month: fromPattern.month,
      day: fromPattern.day,
      weekday: fromPattern.weekday,
      hour12: fromPattern.hour12,
      hour: fromPattern.hour,
      minute: fromPattern.minute,
      second: fromPattern.second
    };
  },
  enumerable: false,
  configurable: true
});


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 */
Intl.DateTimeFormat.supportedLocalesOf = function(locales, options) {
  return supportedLocalesOf('dateformat', locales, options);
};


/**
 * Returns a String value representing the result of calling ToNumber(date)
 * according to the effective locale and the formatting options of this
 * DateTimeFormat.
 */
Intl.DateTimeFormat.prototype.format = function(dateValue) {
  var dateMs;
  if (dateValue === undefined) {
    dateMs = Date.now();
  } else {
    dateMs = Number(dateValue);
  }

  if (!isFinite(dateMs)) {
    throw new RangeException('Provided date is not in valid range.');
  }

  return this.__formatter__.internalFormat(new Date(dateMs));
};


/**
 * Returns new -u- extension with proper key values built from either
 * old extension and/or options. Option values have priority.
 * Updates the options object with new values if necessary.
 */
function updateExtensionAndOptions(options, extension,
                                   unicodeKeys, optionsKeys) {
  if (unicodeKeys.length !== optionsKeys.length) {
    throw Error('Internal error, unicodeKeys.length !== optionsKeys.length.');
  }

  // Parse the extension and extract values.
  for (var i = 0; i < unicodeKeys.length; ++i) {
    var regex = new RegExp('-' + unicodeKeys[i] + '-([a-z0-9]{3,8})+');
    var match = extension.match(regex);
    if (match !== null && !options.hasOwnProperty(optionsKeys[i])) {
      options[optionsKeys[i]] = match[1];
    }
  }

  // Build a new extension (if necessary).
  var newExtension = '';
  for (var i = 0; i < optionsKeys.length; ++i) {
    var key = optionsKeys[i];
    if (options.hasOwnProperty(key) && options[key] !== undefined) {
      newExtension += '-' + unicodeKeys[i] + '-' + options[key];
    }
  }
  if (newExtension !== '') {
    newExtension = '-u' + newExtension;
  }

  return newExtension;
}


/**
 * Returns the subset of the provided BCP 47 language priority list
 * for which this LocaleList object has a match.
 */
function supportedLocalesOf(service, locales, options) {
  if (/^(collator|numberformat|dateformat)$/.test(service) === false) {
    throw new Error('Internal error, wrong service type: ' + service);
  }

  // Provide defaults if matcher was not specified.
  if (options === undefined) {
    options = {};
  } else {
    options = toObject(options);
  }

  var getOption = getGetOption(options, service);
  var matcher = getOption(options, 'localeMatcher', 'string',
                          ['lookup', 'best fit'], 'best fit');

  // Fall back to default locale if necessary.
  var requestedLocales = locales;
  if (requestedLocales === undefined) {
    requestedLocales = new Intl.LocaleList();
  }

  // Force it to be of LocaleList type (eliminating duplicates and make it
  // well-formed).
  if (requestedLocales.constructor !== Intl.LocaleList) {
    requestedLocales = new Intl.LocaleList(requestedLocales);
  }

  // Cache these, they don't ever change per service.
  if (AVAILABLE_LOCALES[service] === undefined) {
    AVAILABLE_LOCALES[service] = NativeJSAvailableLocalesOf(service);
  }

  // Use either best fit or lookup algorithm to match locales.
  if (matcher === 'best fit') {
    return new Intl.LocaleList(bestFitSupportedLocalesOf(
        requestedLocales, AVAILABLE_LOCALES[service]));
  }

  return new Intl.LocaleList(
      lookupSupportedLocalesOf(requestedLocales, AVAILABLE_LOCALES[service]));
}


/**
 * Returns the subset of the provided BCP 47 language priority list for which
 * this LocaleList object has a matching locale when using the BCP 47 Lookup
 * algorithm.
 * Locales appear in the same order in the returned list as in the input list.
 */
function lookupSupportedLocalesOf(requestedLocales, availableLocales) {
  var matchedLocales = [];
  for (var i = 0; i < requestedLocales.length; ++i) {
    // Remove -u- extension.
    var locale = requestedLocales[i].replace(UNICODE_EXTENSION_RE, '');
    do {
      if (availableLocales[locale] !== undefined) {
        // Push requested locale not the resolved one.
        matchedLocales.push(requestedLocales[i]);
        break;
      }
      // Truncate locale if possible, if not break.
      var pos = locale.lastIndexOf('-');
      if (pos === -1) {
        break;
      }
      locale = locale.substring(0, pos);
    } while (true);
  }

  return matchedLocales;
}


/**
 * Returns the subset of the provided BCP 47 language priority list for which
 * this LocaleList object has a matching locale when using the implementation
 * dependent algorithm.
 * Locales appear in the same order in the returned list as in the input list.
 */
function bestFitSupportedLocalesOf(requestedLocales, availableLocales) {
  // TODO(cira): implement better best fit algorithm.
  return lookupSupportedLocalesOf(requestedLocales, availableLocales);
}


/**
 * Returns a getOption function that extracts property value for given
 * options object. If property is missing it returns defaultValue. If value
 * is out of range for that property it throws RangeError.
 */
function getGetOption(options, caller) {
  if (options === undefined) {
    throw new Error('Internal ' + caller + ' error. ' +
                    'Default options are missing.');
  }

  function getOption(property, type, values, defaultValue) {
    if (options[property] !== undefined && options[property] !== null) {
      var value = options[property];
      switch (type) {
        case 'boolean':
          value = Boolean(value);
          break;
        case 'string':
          value = String(value);
          break;
        case 'number':
          value = Number(value);
          break;
        default:
          throw new Error('Internal error. Wrong value type.');
      }
      if (values !== undefined && values.indexOf(value) === -1) {
        throw new RangeError('Value ' + value + ' out of range for ' + caller +
                             ' options property ' + property);
      }

      return value;
    }

    return defaultValue;
  }

  return getOption;
}


/**
 * Compares a BCP 47 language priority list requestedLocales against the locales
 * in availableLocales and determines the best available language to meet the
 * request. Two algorithms are available to match the locales: the Lookup
 * algorithm described in RFC 4647 section 3.4, and an implementation dependent
 * best-fit algorithm. Independent of the locale matching algorithm, options
 * specified through Unicode locale extension sequences are negotiated
 * separately, taking the caller's relevant extension keys and locale data as
 * well as client-provided options into consideration. Returns an object with
 * a locale property whose value is the language tag of the selected locale,
 * and properties for each key in relevantExtensionKeys providing the selected
 * value for that key.
 */
function resolveLocale(service, requestedLocales, options) {
  if (requestedLocales === undefined) {
    requestedLocales = new Intl.LocaleList();
  } else {
    // TODO(cira): mark well formed locale list objects so we don't re-process
    // them.
    requestedLocales = new Intl.LocaleList(requestedLocales);
  }

  var getOption = getGetOption(options, service);
  var matcher = getOption('localeMatcher', 'string',
                          ['lookup', 'best fit'], 'best fit');
  var resolved;
  if (matcher === 'lookup') {
    resolved = lookupMatch(service, requestedLocales);
  } else {
    resolved = bestFitMatch(service, requestedLocales);
  }

  return resolved;
}


/**
 * Returns best matched supported locale and extension info using basic
 * lookup algorithm.
 */
function lookupMatch(service, requestedLocales) {
  if (/^(collator|numberformat|dateformat)$/.test(service) === false) {
    throw new Error('Internal error, wrong service type: ' + service);
  }

  // Cache these, they don't ever change per service.
  if (AVAILABLE_LOCALES[service] === undefined) {
    AVAILABLE_LOCALES[service] = NativeJSAvailableLocalesOf(service);
  }

  for (var i = 0; i < requestedLocales.length; ++i) {
    // Remove all extensions.
    var locale = requestedLocales[i].replace(ANY_EXTENSION_RE, '');
    do {
      if (AVAILABLE_LOCALES[service][locale] !== undefined) {
        // Return the resolved locale and extension.
        var extensionMatch = requestedLocales[i].match(UNICODE_EXTENSION_RE);
        var extension = (extensionMatch === null) ? '' : extensionMatch[0];
        return {'locale': locale, 'extension': extension, 'position': i};
      }
      // Truncate locale if possible.
      var pos = locale.lastIndexOf('-');
      if (pos === -1) {
        break;
      }
      locale = locale.substring(0, pos);
    } while (true);
  }

  // Didn't find a match, return default.
  return {'locale': CURRENT_HOST_LOCALE, 'extension': '', 'position': -1};
}


/**
 * Returns best matched supported locale and extension info using
 * implementation dependend algorithm.
 */
function bestFitMatch(service, requestedLocales) {
  // TODO(cira): implement better best fit algorithm.
  return lookupMatch(service, requestedLocales);
}


/**
 * Parses Unicode extension into key - value map.
 * Returns empty object if the extension string is invalid.
 * We are not concerned with the validity of the values at this point.
 */
function parseExtension(extension) {
  var extensionSplit = extension.split('-');

  // Assume ['', 'u', ...] input, but don't throw.
  if (extensionSplit.length <= 2 ||
      (extensionSplit[0] !== '' && extensionSplit[1] !== 'u')) {
    return {};
  }

  // Key is {2}alphanum, value is {3,8}alphanum.
  // Some keys may not have explicit values (booleans).
  var extensionMap = {};
  var previousKey = undefined;
  for (var i = 2; i < extensionSplit.length; ++i) {
    var length = extensionSplit[i].length;
    var element = extensionSplit[i];
    if (length === 2) {
      extensionMap[element] = undefined;
      previousKey = element;
    } else if (length >= 3 && length <=8 && previousKey !== undefined) {
      extensionMap[previousKey] = element;
      previousKey = undefined;
    } else {
      // There is a value that's too long, or that doesn't have a key.
      return {};
    }
  }

  return extensionMap;
}


/**
 * Converts parameter to an Object if possible.
 */
function toObject(value) {
  if (value === undefined || value === null) {
    throw new TypeError('Value cannot be converted to an Object.');
  }

  return Object(value);
}


/**
 * Returns default locale.
 * Uses navigator.language (browsers), or falls back to 'und' (server side).
 */
function defaultLocale() {
  // First initialization happens without navigator.language so
  // CURRENT_HOST_LOCALE becames 'und'. We want to retain the value that's
  // assigned on user initiated call to LocaleList constructor.
  if (CURRENT_HOST_LOCALE !== undefined && CURRENT_HOST_LOCALE !== 'und') {
    return CURRENT_HOST_LOCALE;
  }

  var fallback = 'und';

  // Use navigator.language if it exists.
  if ((typeof this === 'object') &&
      this.hasOwnProperty('navigator') &&
      this.navigator.language !== undefined) {
    // Canonicalize (we don't want to fail here).
    try {
      var browserLocale = Intl.LocaleList([this.navigator.language]);
    } catch (e) {
      return fallback;
    }

    // Browser locale can be anything. We have to check if it's supported by
    // all of the services.
    var locale = {};
    for (var i = 0; i < AVAILABLE_SERVICES.length; ++i) {
      locale = bestFitMatch(AVAILABLE_SERVICES[i], browserLocale);
      if (locale.locale === 'und') {
        return fallback;
      }
    }
    // Returns the best match we have to current browser locale.
    return locale.locale;
  }

  // We are probably server side, 'und' should work fine.
  return fallback;
}


return Intl;
}());
