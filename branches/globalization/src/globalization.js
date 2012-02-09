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
 * Globalization object is a single object that has some named properties,
 * all of which are constructors.
 *
 * ECMA402, 7.
 */
var Globalization = (function() {

var Globalization = {};

/**
 * Internal property used for locale resolution fallback.
 *
 * ECMA402, 7.2
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
 * Constructs Globalization.LocaleList object given optional locales
 * parameter.
 * Validates the elements as well-formed language tags and omits duplicates.
 *
 * ECMA402, 8.1, 8.2
 * @constructor
 */
Globalization.LocaleList = function(locales) {
  native function NativeJSCanonicalizeLanguageTag();

  if (!this || this.constructor !== Globalization.LocaleList) {
    // Constructor is called as a function
    return new Globalization.LocaleList(locales);
  }

  if (locales === undefined) {
    // Constructor is called without arguments
    locales = [CURRENT_HOST_LOCALE];
  }

  var obj = this;
  var index = 0;
  var seen = {};

  locales.forEach(function (value) {
      var tag = String(value);
      var canonicalizedTag = NativeJSCanonicalizeLanguageTag(tag);
      if (canonicalizedTag === 'invalid-tag') {
        throw new RangeError('Invalid language tag: ' + tag);
      }
      var duplicate = seen.hasOwnProperty(canonicalizedTag);
      if (duplicate) {
        return;
      }
      seen[canonicalizedTag] = true;
      Object.defineProperty(
          obj, index, {value: canonicalizedTag, enumerable: true});
      index++;
    });

  Object.defineProperty(this, 'length', {value: index});
};


/**
 * LocaleList prototype object.
 *
 * ECMA402, 8.3.1, 8.4
 */
Object.defineProperty(Globalization.LocaleList,
                      'prototype',
                      { value: new Globalization.LocaleList() });


/**
 * Constructs Globalization.Collator object given optional locales and options
 * parameters.
 *
 * Ecma402, 10.1, 10.2
 * @constructor
 */
Globalization.Collator = function(locales, options) {
};


/**
 * Collator prototype object.
 *
 * ECMA402, 10.3.1, 10.4
 */
Object.defineProperty(Globalization.Collator,
                      'prototype',
                      { value: new Globalization.Collator() });


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 *
 * ECMA402, 10.3.2
 */
Globalization.Collator.supportedLocalesOf = function(locales, options) {
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
 *
 * ECMA402, 10.4.2
 */
Globalization.Collator.prototype.compare = function(x, y) {
};


/**
 * ECMA402, 11.1, 11.2
 * @constructor
 */
Globalization.NumberFormat = function(locales, options) {
};


/**
 * NumberFormat prototype object.
 * ECMA402, 11.3.1, 11.4
 */
Object.defineProperty(Globalization.NumberFormat,
                      'prototype',
                      { value: new Globalization.NumberFormat() });


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 *
 * ECMA402, 11.3.2
 */
Globalization.NumberFormat.supportedLocalesOf = function(locales, options) {
  return supportedLocalesOf('numberformat', locales, options);
};

/**
 * Returns a String value representing the result of calling ToNumber(value)
 * according to the effective locale and the formatting options of this
 * NumberFormat.
 *
 * ECMA402, 11.4.2.
 */
Globalization.NumberFormat.prototype.format = function (value) {
};


/**
 * ECMA402, 12.1, 12.2
 * @constructor
 */
Globalization.DateTimeFormat = function(locales, options) {
};


/**
 * DateTimeFormat prototype object.
 *
 * ECMA402, 12.3.1, 12.4
 */
Object.defineProperty(Globalization.DateTimeFormat,
                      'prototype',
                      { value: new Globalization.DateTimeFormat() });


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 *
 * ECMA402, 12.3.2
 */
Globalization.DateTimeFormat.supportedLocalesOf = function(locales, options) {
  return supportedLocalesOf('dateformat', locales, options);
};


/**
 * Returns a String value representing the result of calling ToNumber(date)
 * according to the effective locale and the formatting options of this
 * DateTimeFormat.
 *
 * ECMA402, 12.4.2.
 */
Globalization.DateTimeFormat.prototype.format = function (date) {
};


/**
 * Internal functions.
 */


/**
 * Returns the subset of the provided BCP 47 language priority list
 * for which this LocaleList object has a match.
 *
 * ECMA402, 8.4.7
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
    requestedLocales = new Globalization.LocaleList();
  }

  // Force it to be of LocaleList type (eliminating duplicates and make it
  // well-formed).
  if (requestedLocales.constructor !== Globalization.LocaleList) {
    requestedLocales = new Globalization.LocaleList(requestedLocales);
  }

  // Cache these, they don't ever change per service.
  if (AVAILABLE_LOCALES[service] === undefined) {
    AVAILABLE_LOCALES[service] = NativeJSAvailableLocalesOf(service);
  }

  // Use either best fit or lookup algorithm to match locales.
  if (matcher === undefined || matcher === 'best fit') {
    return new Globalization.LocaleList(bestFitSupportedLocalesOf(
        requestedLocales, AVAILABLE_LOCALES[service]));
  }

  return new Globalization.LocaleList(
      lookupSupportedLocalesOf(requestedLocales, AVAILABLE_LOCALES[service]));
}


/**
 * Returns the subset of the provided BCP 47 language priority list for which
 * this LocaleList object has a matching locale when using the BCP 47 Lookup
 * algorithm.
 * Locales appear in the same order in the returned list as in the input list.
 *
 * ECMA402, 8.4.5
 */
function lookupSupportedLocalesOf(requestedLocales, availableLocales) {
  var matchedLocales = [];
  for (var i = 0; i < requestedLocales.length; ++i) {
    // Remove -u- and -x- extensions.
    var locale = requestedLocales[i].replace(/-(u|x)(-([a-z0-9]{2,8}))+/, '');
    do {
      if (availableLocales.hasOwnProperty(locale)) {
        // We could push either requested or supported locale here.
        // Spec says the former for now.
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
 *
 * ECMA402, 8.4.6
 */
function bestFitSupportedLocalesOf(requestedLocales, availableLocales) {
  return availableLocales;
}


/**
 * ECMA402, 7
 */
Object.preventExtensions(Globalization);

return Globalization;
}());
