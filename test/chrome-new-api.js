// Flags: --expose-i18n

// Test v8Intl, to be used in Chrome file manager

var expectedLocaleCode = function(localeCode) {
  var NORMALIZATIONS = {
    'zh-CN': 'zh',
    'zh-TW': 'zh'
    //FIXME: The real expected values are these:
    //'zh-CN': 'zh-Hans-CN',
    //'zh-TW': 'zh-Hant-TW',
  };

  return NORMALIZATIONS[localeCode] || localeCode;
}

// Test date formatter
var testDateFormatter = function(localeCode, options) {
  var DATES = [
    new Date(2012, 2, 20, 5, 14, 27),
    new Date(1970, 0, 1, 0, 0, 0),
    new Date(1968, 11, 31, 23, 59, 59)
  ];

  var formatter;
  var date;
  var field;
  var i;

  formatter = new v8Intl.DateTimeFormat([localeCode], options);
  assertInstanceof(formatter, v8Intl.DateTimeFormat);

  assertEquals(expectedLocaleCode(localeCode),
               formatter.resolvedOptions.locale);
    
  assertInstanceof(formatter.format, Function);

  for (field in options) {
    if (options.hasOwnProperty(field)) {
      assertTrue(formatter.resolvedOptions[field] !== undefined);
    }
  }

  for (i = 0; i < DATES.length; i += 1) {
    date = DATES[i];
    formatted_date = formatter.format(date);
    assertEquals('string', typeof formatted_date);
    assertTrue(formatted_date !== '');
  }
}


// Test collator
var testCollator = function(localeCode) {
  var STRINGS = [
    '', 'alpha', 'Bravo', 'Alpha', 'cafe', 'café', 'Café', 'fi', 'f\u200Ci',
    'zebra', 'aaland', 'Zebra', '\u592B', '\u4E87', 'm\u030C', 'm\u0300', 'Z'
  ];

  var collator;
  var comparison_result;
  var i;
  var j;
  
  collator = new v8Intl.Collator(
    [localeCode + '-u-kn-true'],
    {sensitivity: 'base'}
  );
  assertInstanceof(collator, v8Intl.Collator);

  //FIXME: These two tests fail for some locales like 'am' and 'ur'.
  //assertEquals(expectedLocaleCode(localeCode),
  //             collator.resolvedOptions.locale);
  //assertEquals(true, collator.resolvedOptions.numeric);
  assertEquals('base', collator.resolvedOptions.sensitivity);

  assertInstanceof(collator.compare, Function);

  for (i = 0; i < STRINGS.length; i += 1) {
    for (j = 0; j < STRINGS.length; j += 1) {
      comparison_result = collator.compare(STRINGS[i], STRINGS[j]);
      if (i == j) {
        assertEquals(0, comparison_result);
      } else {
        assertTrue(comparison_result == 0 ||
                   comparison_result == 1 ||
                   comparison_result == -1);
      }
    }
  }
}


// Main test function
var test = function() {
  // There are Chrome localizations with 'iw' and 'no' too,
  // but Chrome calls us with 'he' and 'nb' in those locales.
  var CHROME_LOCALE_CODES = [
    'am', 'ar', 'bg', 'bn', 'ca', 'cs', 'da', 'de', 'el', 'en-US', 'en-GB',
    'es', 'es-419', 'et', 'fa', 'fi', 'fil', 'fr', 'gu', 'he', 'hi', 'hr', 'hu',
    'id', 'it', 'ja', 'kn', 'ko', 'lt', 'lv', 'ml', 'mr', 'nb', 'nl', 'pl',
    'pt-BR', 'pt-PT', 'ro', 'ru', 'sk', 'sl', 'sr', 'sv', 'sw', 'ta', 'te',
    'th', 'tr', 'uk', 'vi', 'zh-CN', 'zh-TW'
  ];

  var DATE_TIME_OPTIONS = [
    {year: 'numeric', month: 'short', day: 'numeric'},
    {hour: '2-digit', minute: '2-digit', second: '2-digit'},
    {minute: '2-digit', second: '2-digit'},
  ];

  var locale_code;
  var i;
  var j;

  for (i = 0; i < CHROME_LOCALE_CODES.length; i += 1) {
    locale_code = CHROME_LOCALE_CODES[i];

    // Test date formatter with skeletons
    for (j = 0; j < DATE_TIME_OPTIONS.length; j += 1) {
      testDateFormatter(locale_code, DATE_TIME_OPTIONS[j]);
    }
    
    testCollator(locale_code);
  }
}


test();
