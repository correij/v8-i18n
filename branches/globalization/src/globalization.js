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
 * ECMA402, Section 7.
 */
Globalization = Object.create(null);


/**
 * ECMA402, 7.2
 */
Globalization.__currentHostLocale = 'und';


/**
 * ECMA402, 8.1, 8.2
 * @constructor
 */
Globalization.LocaleList = function(locales) {
};


/**
 * LocaleList prototype object.
 * ECMA402, 8.3.1, 8.4
 */
Object.defineProperty(Globalization.LocaleList,
                      'prototype',
                      { value: new Globalization.LocaleList() });


/**
 * ECMA402, 10.1, 10.2
 * @constructor
 */
Globalization.Collator = function(locales, options) {
};


/**
 * Collator prototype object.
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
