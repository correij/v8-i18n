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

#include "src/intl-collator.h"

#include "src/utils.h"
#include "unicode/coll.h"
#include "unicode/locid.h"
#include "unicode/ucol.h"

namespace v8_i18n {

v8::Persistent<v8::FunctionTemplate> IntlCollator::intl_collator_template_;

static icu::Collator* InitializeCollator(v8::Handle<v8::String>,
                                         v8::Handle<v8::Object>,
                                         v8::Handle<v8::Object>);
static icu::Collator* CreateICUCollator(const icu::Locale&,
                                        v8::Handle<v8::Object>);
static void SetResolvedSettings(const icu::Locale&,
                                icu::Collator*,
                                v8::Handle<v8::Object>);
static void SetBooleanAttribute(UColAttribute,
                                icu::Collator*,
                                const char*,
                                v8::Handle<v8::Object>);

icu::Collator* IntlCollator::UnpackIntlCollator(v8::Handle<v8::Object> obj) {
  if (intl_collator_template_->HasInstance(obj)) {
    return static_cast<icu::Collator*>(obj->GetPointerFromInternalField(0));
  }

  return NULL;
}

void IntlCollator::DeleteIntlCollator(v8::Persistent<v8::Value> object,
                                      void* param) {
  v8::Persistent<v8::Object> persistent_object =
      v8::Persistent<v8::Object>::Cast(object);

  // First delete the hidden C++ object.
  // Unpacking should never return NULL here. That would only happen if
  // this method is used as the weak callback for persistent handles not
  // pointing to a collator.
  delete UnpackIntlCollator(persistent_object);

  // Then dispose of the persistent handle to JS object.
  persistent_object.Dispose();
}

// Throws a JavaScript exception.
static v8::Handle<v8::Value> ThrowUnexpectedObjectError() {
  // Returns undefined, and schedules an exception to be thrown.
  return v8::ThrowException(v8::Exception::Error(
      v8::String::New("Collator method called on an object "
                      "that is not a Collator.")));
}

// When there's an ICU error, throw a JavaScript error with |message|.
static v8::Handle<v8::Value> ThrowExceptionForICUError(const char* message) {
  return v8::ThrowException(v8::Exception::Error(v8::String::New(message)));
}

// static
v8::Handle<v8::Value> IntlCollator::InternalCompare(const v8::Arguments& args) {
  if (args.Length() != 2 || !args[0]->IsString() || !args[1]->IsString()) {
    return v8::ThrowException(v8::Exception::SyntaxError(
        v8::String::New("Two string arguments are required.")));
  }

  icu::Collator* collator = UnpackIntlCollator(args.Holder());
  if (!collator) {
    return ThrowUnexpectedObjectError();
  }

  v8::String::Value string_value1(args[0]);
  v8::String::Value string_value2(args[1]);
  const UChar* string1 = reinterpret_cast<const UChar*>(*string_value1);
  const UChar* string2 = reinterpret_cast<const UChar*>(*string_value2);
  UErrorCode status = U_ZERO_ERROR;
  UCollationResult result = collator->compare(
      string1, string_value1.length(), string2, string_value2.length(), status);

  if (U_FAILURE(status)) {
    return ThrowExceptionForICUError(
        "Internal error. Unexpected failure in Collator.compare.");
  }

  return v8::Int32::New(result);
}

v8::Handle<v8::Value> IntlCollator::JSCreateCollator(
    const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  if (args.Length() != 2 || !args[0]->IsString() || !args[1]->IsObject()) {
    return v8::ThrowException(v8::Exception::SyntaxError(
        v8::String::New("Locale and collation options are required.")));
  }

  if (intl_collator_template_.IsEmpty()) {
    v8::Local<v8::FunctionTemplate> raw_template(v8::FunctionTemplate::New());

    // Define internal field count on instance template.
    v8::Local<v8::ObjectTemplate> object_template =
        raw_template->InstanceTemplate();

    // Set aside internal fields for icu collator.
    object_template->SetInternalFieldCount(1);

    // Define all of the prototype methods on prototype template.
    v8::Local<v8::ObjectTemplate> proto = raw_template->PrototypeTemplate();
    proto->Set(v8::String::New("internalCompare"),
               v8::FunctionTemplate::New(InternalCompare));

    intl_collator_template_ =
        v8::Persistent<v8::FunctionTemplate>::New(raw_template);
  }

  // Create an empty object wrapper.
  v8::Local<v8::Object> local_object =
      intl_collator_template_->GetFunction()->NewInstance();
  v8::Persistent<v8::Object> wrapper =
      v8::Persistent<v8::Object>::New(local_object);

  // Set collator as internal field of the resulting JS object.
  icu::Collator* collator = InitializeCollator(
      args[0]->ToString(), args[1]->ToObject(), wrapper);

  if (!collator) {
    return v8::ThrowException(v8::Exception::Error(v8::String::New(
        "Internal error. Couldn't create ICU collator.")));
  } else {
    wrapper->SetPointerInInternalField(0, collator);
  }

  // Make object handle weak so we can delete iterator once GC kicks in.
  wrapper.MakeWeak(NULL, DeleteIntlCollator);

  return wrapper;
}

static icu::Collator* InitializeCollator(v8::Handle<v8::String> locale,
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

  icu::Collator* collator = CreateICUCollator(icu_locale, options);
  if (!collator) {
    // Remove extensions and try again.
    icu::Locale no_extension_locale(icu_locale.getBaseName());
    collator = CreateICUCollator(no_extension_locale, options);

    // Set resolved settings (pattern, numbering system).
    SetResolvedSettings(no_extension_locale, collator, wrapper);
  } else {
    SetResolvedSettings(icu_locale, collator, wrapper);
  }

  return collator;
}

static icu::Collator* CreateICUCollator(
    const icu::Locale& icu_locale, v8::Handle<v8::Object> options) {
  // Make collator from options.
  icu::Collator* collator = NULL;
  UErrorCode status = U_ZERO_ERROR;
  collator = icu::Collator::createInstance(icu_locale, status);

  if (U_FAILURE(status)) {
    delete collator;
    return NULL;
  }

  // Below, we change collation options that are explicitly specified
  // by a caller in JavaScript. Otherwise, we don't touch because
  // we don't want to change the locale-dependent default value.
  // The three options below are very likely to have the same default
  // across locales, but I haven't checked them all. Others we may add
  // in the future have certainly locale-dependent default (e.g.
  // caseFirst is upperFirst for Danish while is off for most other locales).

  bool ignore_case, ignore_accents, numeric;

  if (Utils::ExtractBooleanSetting(options, "ignoreCase", &ignore_case)) {
    // We need to explicitly set the level to secondary to get case ignored.
    // The default L3 ignores UCOL_CASE_LEVEL == UCOL_OFF !
    if (ignore_case) {
      collator->setStrength(icu::Collator::SECONDARY);
    }
    collator->setAttribute(UCOL_CASE_LEVEL, ignore_case ? UCOL_OFF : UCOL_ON,
                           status);
    if (U_FAILURE(status)) {
      delete collator;
      return NULL;
    }
  }

  // Accents are taken into account with strength secondary or higher.
  if (Utils::ExtractBooleanSetting(options, "ignoreAccents", &ignore_accents)) {
    if (!ignore_accents) {
      collator->setStrength(icu::Collator::SECONDARY);
    } else {
      collator->setStrength(icu::Collator::PRIMARY);
    }
  }

  if (Utils::ExtractBooleanSetting(options, "numeric", &numeric)) {
    collator->setAttribute(UCOL_NUMERIC_COLLATION,
                           numeric ? UCOL_ON : UCOL_OFF, status);
    if (U_FAILURE(status)) {
      delete collator;
      return NULL;
    }
  }

  return collator;
}

static void SetResolvedSettings(const icu::Locale& icu_locale,
                                icu::Collator* collator,
                                v8::Handle<v8::Object> wrapper) {
  v8::HandleScope handle_scope;

  SetBooleanAttribute(UCOL_FRENCH_COLLATION, collator, "backwards", wrapper);
  SetBooleanAttribute(UCOL_CASE_LEVEL, collator, "caseLevel", wrapper);
  SetBooleanAttribute(UCOL_NUMERIC_COLLATION, collator, "numeric", wrapper);
  SetBooleanAttribute(UCOL_HIRAGANA_QUATERNARY_MODE, collator,
                      "hiraganaQuaternary", wrapper);
  SetBooleanAttribute(UCOL_NORMALIZATION_MODE, collator,
                      "normalization", wrapper);

  UErrorCode status = U_ZERO_ERROR;

  UColAttributeValue attr_result =
      collator->getAttribute(UCOL_CASE_FIRST, status);
  if(attr_result == UCOL_LOWER_FIRST) {
    wrapper->Set(v8::String::New("caseFirst"), v8::String::New("lower"));
  } else if(attr_result == UCOL_UPPER_FIRST) {
    wrapper->Set(v8::String::New("caseFirst"), v8::String::New("upper"));
  } else {
    // Default.
    wrapper->Set(v8::String::New("caseFirst"), v8::String::New("false"));
  }

  attr_result = collator->getAttribute(UCOL_STRENGTH, status);
  if(attr_result == UCOL_PRIMARY) {
    wrapper->Set(v8::String::New("strength"), v8::String::New("primary"));
  } else if(attr_result == UCOL_SECONDARY) {
    wrapper->Set(v8::String::New("strength"), v8::String::New("secondary"));
  } else if(attr_result == UCOL_TERTIARY) {
    wrapper->Set(v8::String::New("strength"), v8::String::New("tertiary"));
  } else if(attr_result == UCOL_QUATERNARY) {
    wrapper->Set(v8::String::New("strength"), v8::String::New("quaternary"));
  } else {
    wrapper->Set(v8::String::New("strength"), v8::String::New("identical"));
  }
}

static void SetBooleanAttribute(UColAttribute attribute,
                                icu::Collator* collator,
                                const char* property,
                                v8::Handle<v8::Object> wrapper) {
  UErrorCode status = U_ZERO_ERROR;
  bool bool_result;
  UColAttributeValue attr_result = collator->getAttribute(attribute, status);
  if (attr_result == UCOL_ON) {
    bool_result = true;
  } else {
    bool_result = false;
  }

  if(U_SUCCESS(status)) {
    wrapper->Set(v8::String::New(property), v8::Boolean::New(bool_result));
  }
}

}  // namespace v8_i18n
