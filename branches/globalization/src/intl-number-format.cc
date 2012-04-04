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

#include "src/intl-number-format.h"

#include <string.h>

#include "src/utils.h"
#include "unicode/dcfmtsym.h"
#include "unicode/decimfmt.h"
#include "unicode/locid.h"
#include "unicode/numfmt.h"
#include "unicode/numsys.h"
#include "unicode/uchar.h"
#include "unicode/ucurr.h"
#include "unicode/unum.h"
#include "unicode/uversion.h"

namespace v8_i18n {

v8::Persistent<v8::FunctionTemplate> IntlNumberFormat::number_format_template_;

static icu::DecimalFormat* InitializeNumberFormat(v8::Handle<v8::String>,
                                                  v8::Handle<v8::Object>,
                                                  v8::Handle<v8::Object>);
static icu::DecimalFormat* CreateICUNumberFormat(const icu::Locale&,
                                                 v8::Handle<v8::Object>);
static void SetResolvedSettings(const icu::Locale&,
                                icu::DecimalFormat*,
                                v8::Handle<v8::Object>);

icu::DecimalFormat* IntlNumberFormat::UnpackIntlNumberFormat(
    v8::Handle<v8::Object> obj) {
  if (number_format_template_->HasInstance(obj)) {
    return static_cast<icu::DecimalFormat*>(
        obj->GetPointerFromInternalField(0));
  }

  return NULL;
}

void IntlNumberFormat::DeleteIntlNumberFormat(v8::Persistent<v8::Value> object,
                                              void* param) {
  v8::Persistent<v8::Object> persistent_object =
      v8::Persistent<v8::Object>::Cast(object);

  // First delete the hidden C++ object.
  // Unpacking should never return NULL here. That would only happen if
  // this method is used as the weak callback for persistent handles not
  // pointing to a date time formatter.
  delete UnpackIntlNumberFormat(persistent_object);

  // Then dispose of the persistent handle to JS object.
  persistent_object.Dispose();
}

v8::Handle<v8::Value> IntlNumberFormat::InternalFormat(
    const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  if (args.Length() != 1 || !args[0]->IsNumber()) {
    v8::ThrowException(v8::Exception::Error(
        v8::String::New("Internal error. Numeric value has to be specified.")));
  }

  icu::DecimalFormat* number_format = UnpackIntlNumberFormat(args.Holder());
  if (!number_format) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New("NumberFormat method called on an object "
                        "that is not a NumberFormat.")));
  }

  // ICU will handle actual NaN value properly and return NaN string.
  icu::UnicodeString result;
  number_format->format(args[0]->NumberValue(), result);

  return v8::String::New(
      reinterpret_cast<const uint16_t*>(result.getBuffer()), result.length());
}

v8::Handle<v8::Value> IntlNumberFormat::JSCreateNumberFormat(
    const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  if (args.Length() != 2 || !args[0]->IsString() || !args[1]->IsObject()) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New(
            "Internal error. Locale and options are required.")));
  }

  if (number_format_template_.IsEmpty()) {
    v8::Local<v8::FunctionTemplate> raw_template(v8::FunctionTemplate::New());

    // Define internal field count on instance template.
    v8::Local<v8::ObjectTemplate> object_template =
        raw_template->InstanceTemplate();

    // Set aside internal field for icu number formatter.
    object_template->SetInternalFieldCount(1);

    // Define all of the prototype methods on prototype template.
    v8::Local<v8::ObjectTemplate> proto = raw_template->PrototypeTemplate();
    proto->Set(v8::String::New("internalFormat"),
               v8::FunctionTemplate::New(InternalFormat));

    number_format_template_ =
        v8::Persistent<v8::FunctionTemplate>::New(raw_template);
  }

  // Create an empty object wrapper.
  v8::Local<v8::Object> local_object =
      number_format_template_->GetFunction()->NewInstance();
  v8::Persistent<v8::Object> wrapper =
      v8::Persistent<v8::Object>::New(local_object);

  // Set number formatter as internal field of the resulting JS object.
  icu::DecimalFormat* number_format = InitializeNumberFormat(
      args[0]->ToString(), args[1]->ToObject(), wrapper);

  if (!number_format) {
    return v8::ThrowException(v8::Exception::Error(v8::String::New(
        "Internal error. Couldn't create ICU number formatter.")));
  } else {
    wrapper->SetPointerInInternalField(0, number_format);
  }

  // Make object handle weak so we can delete iterator once GC kicks in.
  wrapper.MakeWeak(NULL, DeleteIntlNumberFormat);

  return wrapper;
}

static icu::DecimalFormat* InitializeNumberFormat(
    v8::Handle<v8::String> locale,
    v8::Handle<v8::Object> options,
    v8::Handle<v8::Object> wrapper) {
  v8::HandleScope handle_scope;

  // Convert BCP47 into ICU locale format.
  UErrorCode status = U_ZERO_ERROR;
  char icu_result[ULOC_FULLNAME_CAPACITY];
  int icu_length = 0;
  v8::String::AsciiValue bcp47_locale(locale);
  uloc_forLanguageTag(*bcp47_locale, icu_result, ULOC_FULLNAME_CAPACITY,
                      &icu_length, &status);
  if (U_FAILURE(status) || icu_length == 0) {
    return NULL;
  }
  icu::Locale icu_locale(icu_result);

  icu::DecimalFormat* number_format =
      CreateICUNumberFormat(icu_locale, options);
  if (!number_format) {
    // Remove extensions and try again.
    icu::Locale no_extension_locale(icu_locale.getBaseName());
    number_format = CreateICUNumberFormat(no_extension_locale, options);

    // Set resolved settings (pattern, numbering system).
    SetResolvedSettings(no_extension_locale, number_format, wrapper);
  } else {
    SetResolvedSettings(icu_locale, number_format, wrapper);
  }

  return number_format;
}

static icu::DecimalFormat* CreateICUNumberFormat(
    const icu::Locale& icu_locale, v8::Handle<v8::Object> options) {
  // Make formatter from options. Numbering system is added
  // to the locale as Unicode extension (if it was specified at all).
  UErrorCode status = U_ZERO_ERROR;
  icu::DecimalFormat* number_format = NULL;
  icu::UnicodeString style;
  icu::UnicodeString currency;
  if (Utils::ExtractStringSetting(options, "style", &style)) {
    if (style == UNICODE_STRING_SIMPLE("currency")) {
      Utils::ExtractStringSetting(options, "currency", &currency);

      icu::UnicodeString display;
      Utils::ExtractStringSetting(options, "currencyDisplay", &display);
#if (U_ICU_VERSION_MAJOR_NUM == 4) && (U_ICU_VERSION_MINOR_NUM <= 6)
      icu::NumberFormat::EStyles style;
      if (display == UNICODE_STRING_SIMPLE("code")) {
        style = icu::NumberFormat::kIsoCurrencyStyle;
      } else if (display == UNICODE_STRING_SIMPLE("name")) {
        style = icu::NumberFormat::kPluralCurrencyStyle;
      } else {
        style = icu::NumberFormat::kCurrencyStyle;
      }
#else  // ICU version is 4.8 or above (we ignore versions below 4.0).
      UNumberFormatStyle style;
      if (display == UNICODE_STRING_SIMPLE("code")) {
        style = UNUM_CURRENCY_ISO;
      } else if (display == UNICODE_STRING_SIMPLE("name")) {
        style = UNUM_CURRENCY_PLURAL;
      } else {
        style = UNUM_CURRENCY;
      }
#endif

      number_format = static_cast<icu::DecimalFormat*>(
          icu::NumberFormat::createInstance(icu_locale, style,  status));
    } else if (style == UNICODE_STRING_SIMPLE("percent")) {
      number_format = static_cast<icu::DecimalFormat*>(
          icu::NumberFormat::createPercentInstance(icu_locale, status));
    } else {
      // Make a decimal instance by default.
      number_format = static_cast<icu::DecimalFormat*>(
          icu::NumberFormat::createInstance(icu_locale, status));
    }
  }

  if (U_FAILURE(status)) {
    delete number_format;
    return NULL;
  }

  // Set all options.
  if (!currency.isEmpty()) {
    number_format->setCurrency(currency.getBuffer(), status);
  }

  int32_t digits;
  if (Utils::ExtractIntegerSetting(
          options, "minimumIntegerDigits", &digits)) {
    number_format->setMinimumIntegerDigits(digits);
  }

  if (Utils::ExtractIntegerSetting(
          options, "minimumFractionDigits", &digits)) {
    number_format->setMinimumFractionDigits(digits);
  }

  if (Utils::ExtractIntegerSetting(
          options, "maximumFractionDigits", &digits)) {
    number_format->setMaximumFractionDigits(digits);
  }

  if (Utils::ExtractIntegerSetting(
          options, "minimumSignificantDigits", &digits)) {
    number_format->setMinimumSignificantDigits(digits);
  }

  if (Utils::ExtractIntegerSetting(
          options, "maximumSignificantDigits", &digits)) {
    number_format->setMaximumSignificantDigits(digits);
  }

  bool grouping;
  if (Utils::ExtractBooleanSetting(options, "useGrouping", &grouping)) {
    number_format->setGroupingUsed(grouping);
  }

  // Set rounding mode.
  number_format->setRoundingMode(icu::DecimalFormat::kRoundUp);

  return number_format;
}

static void SetResolvedSettings(const icu::Locale& icu_locale,
                                icu::DecimalFormat* number_format,
                                v8::Handle<v8::Object> wrapper) {
  v8::HandleScope handle_scope;

  icu::UnicodeString pattern;
  number_format->toPattern(pattern);
  wrapper->Set(v8::String::New("pattern"),
               v8::String::New(reinterpret_cast<const uint16_t*>(
                   pattern.getBuffer()), pattern.length()));

  // Set resolved currency code in options.currency if not empty.
  icu::UnicodeString currency(number_format->getCurrency());
  if (!currency.isEmpty()) {
    wrapper->Set(v8::String::New("currency"),
                 v8::String::New(reinterpret_cast<const uint16_t*>(
                     currency.getBuffer()), currency.length()));
  }

  // Ugly hack. ICU doesn't expose numbering system in any way, so we have
  // to assume that for given locale NumberingSystem constructor produces the
  // same digits as NumberFormat would.
  UErrorCode status = U_ZERO_ERROR;
  icu::NumberingSystem* numbering_system =
      icu::NumberingSystem::createInstance(icu_locale, status);
  if (U_SUCCESS(status)) {
    const char* ns = numbering_system->getName();
    wrapper->Set(v8::String::New("numberingSystem"), v8::String::New(ns));
  } else {
    wrapper->Set(v8::String::New("numberingSystem"), v8::Undefined());
  }

  wrapper->Set(v8::String::New("useGrouping"),
               v8::Boolean::New(number_format->isGroupingUsed()));

  wrapper->Set(v8::String::New("minimumIntegerDigits"),
               v8::Integer::New(number_format->getMinimumIntegerDigits()));

  wrapper->Set(v8::String::New("minimumFractionDigits"),
               v8::Integer::New(number_format->getMinimumFractionDigits()));

  wrapper->Set(v8::String::New("maximumFractionDigits"),
               v8::Integer::New(number_format->getMaximumFractionDigits()));

  wrapper->Set(v8::String::New("minimumSignificantDigits"),
               v8::Integer::New(number_format->getMinimumSignificantDigits()));

  wrapper->Set(v8::String::New("maximumSignificantDigits"),
               v8::Integer::New(number_format->getMaximumSignificantDigits()));
}

}  // namespace v8_i18n
