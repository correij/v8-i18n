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
var currentHostLocale = 'root';


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
    locales = [currentHostLocale];
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
Globalization.Collator.supportedLocalesOf = function(requestedLocales) {
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
Globalization.NumberFormat.supportedLocalesOf = function(requestedLocales) {
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
Globalization.DateTimeFormat.supportedLocalesOf = function(requestedLocales) {
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
 * ECMA402, 7
 */
Object.preventExtensions(Globalization);

return Globalization;
}());
