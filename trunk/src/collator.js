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
  setOptions(
      options, extensionMap, COLLATOR_KEY_MAP, getOption, internalOptions);

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

  var internalCollator = NativeJSCreateCollator(locale.locale + extension,
						internalOptions);
  internalCollator.usage = internalOptions.usage;
  internalCollator.collation = internalOptions.collation;

  // Writable, configurable and enumerable are set to false by default.
  Object.defineProperty(collator, 'collator', {value: internalCollator});

  return collator;
}


/**
 * Constructs v8Intl.Collator object given optional locales and options
 * parameters.
 *
 * @constructor
 */
v8Intl.Collator = function(locales, options) {
  if (!this || this === v8Intl) {
    // Constructor is called as a function.
    return new v8Intl.Collator(locales, options);
  }

  return initializeCollator(toObject(this), locales, options);
};


/**
 * Collator resolvedOptions method.
 */
v8Intl.Collator.prototype.resolvedOptions = function() {
  return {
    locale: this.collator.locale,
    usage: this.collator.usage,
    sensitivity: this.collator.sensitivity,
    ignorePunctuation: this.collator.ignorePunctuation,
    numeric: this.collator.numeric,
    normalization: this.collator.normalization,
    caseFirst: this.collator.caseFirst,
    collation: this.collator.collation
  };
};


/**
 * Returns the subset of the given locale list for which this locale list
 * has a matching (possibly fallback) locale. Locales appear in the same
 * order in the returned list as in the input list.
 */
v8Intl.Collator.supportedLocalesOf = function(locales, options) {
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
  native function NativeJSInternalCompare();
  return NativeJSInternalCompare(collator.collator, String(x), String(y));
};


addBoundMethod(v8Intl.Collator, 'compare', compare);
