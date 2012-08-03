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
 * Canonicalizes the language tag, or throws in case the tag is invalid.
 */
function canonicalizeLanguageTag(localeID) {
  native function NativeJSCanonicalizeLanguageTag();

  // null is typeof 'object' so we have to do extra check.
  if (typeof localeID !== 'string' && typeof localeID !== 'object' ||
      localeID === null) {
    throw new TypeError('Language ID should be string or object.');
  }

  var localeString = String(localeID);

  // Throw if there is '_' in the string. Spec only allows '-'.
  if (localeString.search(/_/) !== -1) {
    throw new RangeError('Invalid language tag: ' + localeString);
  }

  // This call will strip -kn but not -kn-true extensions.
  // ICU bug filled - http://bugs.icu-project.org/trac/ticket/9265.
  // TODO(cira): check if -u-kn-true-kc-true-kh-true still throws after
  // upgrade to ICU 4.9.
  var tag = NativeJSCanonicalizeLanguageTag(localeString);
  if (tag === 'invalid-tag') {
    throw new RangeError('Invalid language tag: ' + localeString);
  }

  return tag;
}


/**
 * Returns an array where all locales are canonicalized and duplicates removed.
 * Throws on locales that are not well formed BCP47 tags.
 */
function initializeLocaleList(locales) {
  var seen = [];
  if (locales === undefined) {
    // Constructor is called without arguments.
    seen = [];
  } else {
    // We allow single string localeID.
    if (typeof locales === 'string') {
      seen.push(canonicalizeLanguageTag(locales));
      return seen;
    }

    var o = toObject(locales);
    // Converts it to UInt32 (>>> is shr on 32bit integers).
    var len = o.length >>> 0;

    for (var k = 0; k < len; k++) {
      if (k in o) {
        var value = o[k];

        var tag = canonicalizeLanguageTag(value);

        if (seen.indexOf(tag) === -1) {
          seen.push(tag);
        }
      }
    }
  }

  return seen;
}
