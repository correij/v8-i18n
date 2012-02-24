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
 * Internal property used for locale resolution fallback.
 * It's a implementation replacement for internal DefaultLocale method.
 */
var CURRENT_HOST_LOCALE = 'root';

/**
 * Caches available locales for each service.
 */
var AVAILABLE_LOCALES = {
  'collator': undefined,
  'numberformat': undefined,
  'dateformat': undefined
}


/**
 * Constructs Intl.LocaleList object given optional locales parameter.
 * Validates the elements as well-formed language tags and omits duplicates.
 *
 * @constructor
 */
Intl.LocaleList = function(locales) {
  native function NativeJSCanonicalizeLanguageTag();

  if (!this || this === Intl) {
    // Constructor is called as a function.
    return new Intl.LocaleList(locales);
  }

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

        var tag = NativeJSCanonicalizeLanguageTag(String(value));
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
    Object.defineProperty(this, String(index),
                          {value: seen[index],
                           writable: false,
                           enumerable: true,
                           configurable: false});
  }

  Object.defineProperty(this, 'length', {value: index,
                                         writable: false,
                                         enumerable: false,
                                         configurable: false});
};


/**
 * LocaleList prototype object.
 */
Object.defineProperty(Intl.LocaleList,
                      'prototype',
                      { value: new Intl.LocaleList() });


/**
 * Constructs Intl.Collator object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.Collator = function(locales, options) {
};


/**
 * Collator prototype object.
 */
Object.defineProperty(Intl.Collator,
                      'prototype',
                      { value: new Intl.Collator() });


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
Intl.Collator.prototype.compare = function(x, y) {
};


/**
 * Constructs Intl.NumberFormat object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.NumberFormat = function(locales, options) {
};


/**
 * NumberFormat prototype object.
 */
Object.defineProperty(Intl.NumberFormat,
                      'prototype',
                      { value: new Intl.NumberFormat() });


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
};


/**
 * Constructs Intl.DateTimeFormat object given optional locales and options
 * parameters.
 *
 * @constructor
 */
Intl.DateTimeFormat = function(locales, options) {
};


/**
 * DateTimeFormat prototype object.
 */
Object.defineProperty(Intl.DateTimeFormat,
                      'prototype',
                      { value: new Intl.DateTimeFormat() });


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
Intl.DateTimeFormat.prototype.format = function (date) {
};


/**
 * Internal functions.
 */


/**
 * Returns the subset of the provided BCP 47 language priority list
 * for which this LocaleList object has a match.
 */
function supportedLocalesOf(service, locales, options) {
  native function NativeJSAvailableLocalesOf();

  if (/^(collator|numberformat|dateformat)$/.test(service) === false) {
    throw new Error('Internal error, wrong service type: ' + service);
  }

  // Provide defaults if matcher was not specified.
  if (options === undefined) {
    options = { 'localeMatcher': 'best fit' };
  }

  var matcher = undefined;
  if (options.hasOwnProperty('localeMatcher')) {
    matcher = options['localeMatcher'];
    if (matcher !== undefined &&
        matcher !== 'best fit' &&
        matcher !== 'lookup') {
      throw new RangeError('Invalid localeMatcher value: ' + matcher);
    }
  }

  // Fall back to CURRENT_HOST_LOCALE if necessary.
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
  if (matcher === undefined || matcher === 'best fit') {
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
    // Remove -u- and -x- extensions.
    var locale = requestedLocales[i].replace(/-u(-([a-z0-9]{2,8}))+/, '');
    do {
      if (availableLocales.hasOwnProperty(locale)) {
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
  // Return lookup results for now.
  return lookupSupportedLocalesOf(requestedLocales, availableLocales);
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


return Intl;
}());
