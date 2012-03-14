// Copyright 2011 the v8-i18n authors.
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

#include "src/intl-date-format.h"

#include <string.h>

#include "src/utils.h"
#include "unicode/calendar.h"
#include "unicode/dtfmtsym.h"
#include "unicode/dtptngen.h"
#include "unicode/locid.h"
#include "unicode/numsys.h"
#include "unicode/smpdtfmt.h"
#include "unicode/timezone.h"

namespace v8_i18n {

v8::Persistent<v8::FunctionTemplate> IntlDateFormat::date_format_template_;

static icu::DateFormat* InitializeDateTimeFormat(const icu::Locale&,
                                                 v8::Handle<v8::Object>);
static v8::Handle<v8::Value> SetResolvedSettings(
    const icu::Locale&, icu::SimpleDateFormat* date_format);

icu::SimpleDateFormat* IntlDateFormat::UnpackIntlDateFormat(
    v8::Handle<v8::Object> obj) {
  if (date_format_template_->HasInstance(obj)) {
    return static_cast<icu::SimpleDateFormat*>(
        obj->GetPointerFromInternalField(0));
  }

  return NULL;
}

void IntlDateFormat::DeleteIntlDateFormat(v8::Persistent<v8::Value> object,
                                          void* param) {
  v8::Persistent<v8::Object> persistent_object =
      v8::Persistent<v8::Object>::Cast(object);

  // First delete the hidden C++ object.
  // Unpacking should never return NULL here. That would only happen if
  // this method is used as the weak callback for persistent handles not
  // pointing to a date time formatter.
  delete UnpackIntlDateFormat(persistent_object);

  // Then dispose of the persistent handle to JS object.
  persistent_object.Dispose();
}

v8::Handle<v8::Value> IntlDateFormat::InternalFormat(
    const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  double millis = 0.0;
  if (args.Length() != 1 || !args[0]->IsDate()) {
    v8::ThrowException(v8::Exception::Error(
        v8::String::New("Internal error. Date value has to be specified.")));
  } else {
    millis = v8::Date::Cast(*args[0])->NumberValue();
  }

  icu::SimpleDateFormat* date_format = UnpackIntlDateFormat(args.Holder());
  if (!date_format) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New("DateTimeFormat method called on an object "
                        "that is not a DateTimeFormat.")));
  }

  icu::UnicodeString result;
  date_format->format(millis, result);

  return v8::String::New(
      reinterpret_cast<const uint16_t*>(result.getBuffer()), result.length());
}

v8::Handle<v8::Value> IntlDateFormat::JSCreateDateTimeFormat(
    const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  if (args.Length() != 2 || !args[0]->IsString() || !args[1]->IsObject()) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New(
            "Internal error. Locale and options are required.")));
  }

  if (date_format_template_.IsEmpty()) {
    v8::Local<v8::FunctionTemplate> raw_template(v8::FunctionTemplate::New());

    // Define internal field count on instance template.
    v8::Local<v8::ObjectTemplate> object_template =
        raw_template->InstanceTemplate();

    // Set aside internal field for icu date time formatter.
    object_template->SetInternalFieldCount(1);

    // Define all of the prototype methods on prototype template.
    v8::Local<v8::ObjectTemplate> proto = raw_template->PrototypeTemplate();
    proto->Set(v8::String::New("internalFormat"),
               v8::FunctionTemplate::New(InternalFormat));

    date_format_template_ =
        v8::Persistent<v8::FunctionTemplate>::New(raw_template);
  }

  // Create an empty object wrapper.
  v8::Local<v8::Object> local_object =
      date_format_template_->GetFunction()->NewInstance();
  v8::Persistent<v8::Object> wrapper =
      v8::Persistent<v8::Object>::New(local_object);

  // Convert BCP47 into ICU locale format.
  UErrorCode status = U_ZERO_ERROR;
  char icu_result[ULOC_FULLNAME_CAPACITY];
  int icu_length = 0;
  v8::String::AsciiValue bcp47_locale(args[0]->ToString());
  uloc_forLanguageTag(*bcp47_locale, icu_result, ULOC_FULLNAME_CAPACITY,
                      &icu_length, &status);
  if (U_FAILURE(status) || icu_length == 0) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New("Internal error. Cannot convert to icu locale.")));
  }
  icu::Locale icu_locale(icu_result);

  // Set date time formatter as internal field of the resulting JS object.
  icu::SimpleDateFormat* date_format = static_cast<icu::SimpleDateFormat*>(
      InitializeDateTimeFormat(icu_locale, args[1]->ToObject()));
  if (!date_format) {
    return v8::ThrowException(v8::Exception::Error(
        v8::String::New("Internal error. Couldn't create date formatter.")));
  }
  wrapper->SetPointerInInternalField(0, date_format);

  // Set resolved settings (pattern, numbering system, calendar).
  wrapper->Set(v8::String::New("options"),
               SetResolvedSettings(icu_locale, date_format));

  // Make object handle weak so we can delete iterator once GC kicks in.
  wrapper.MakeWeak(NULL, DeleteIntlDateFormat);

  return wrapper;
}

static icu::DateFormat* InitializeDateTimeFormat(
    const icu::Locale& icu_locale, v8::Handle<v8::Object> options) {
  v8::HandleScope handle_scope;

  // Create time zone as specified by the user.
  icu::TimeZone* tz = NULL;
  icu::UnicodeString timezone;
  if (Utils::ExtractStringSetting(options, "timeZone", &timezone)) {
    if (timezone != UNICODE_STRING_SIMPLE("UTC")) {
      return NULL;
    }
    tz = icu::TimeZone::createTimeZone("GMT");
  } else {
    tz = icu::TimeZone::createDefault();
  }

  // Create a calendar using locale, and apply time zone to it.
  UErrorCode status = U_ZERO_ERROR;
  icu::Calendar* calendar =
      icu::Calendar::createInstance(tz, icu_locale, status);
  if (U_FAILURE(status)) {
    delete calendar;
    return NULL;
  }

  // Make formatter from skeleton. Calendar and numbering system are added
  // to the locale as Unicode extension (if they were specified at all).
  icu::SimpleDateFormat* date_format = NULL;
  icu::UnicodeString skeleton;
  if (Utils::ExtractStringSetting(options, "skeleton", &skeleton)) {
    v8::Local<icu::DateTimePatternGenerator> generator(
        icu::DateTimePatternGenerator::createInstance(icu_locale, status));
    icu::UnicodeString pattern =
        generator->getBestPattern(skeleton, status);

    date_format = new icu::SimpleDateFormat(pattern, icu_locale, status);
    if (U_FAILURE(status)) {
      return NULL;
    }
    date_format->adoptCalendar(calendar);
  } else {
    // Skeleton was not specified.
    delete calendar;
  }
  return date_format;
}

static v8::Handle<v8::Value> SetResolvedSettings(
    const icu::Locale& icu_locale, icu::SimpleDateFormat* date_format) {
  v8::HandleScope handle_scope;

  v8::Handle<v8::Object> options = v8::Object::New();

  icu::UnicodeString pattern;
  date_format->toPattern(pattern);
  options->Set(v8::String::New("pattern"),
               v8::String::New(reinterpret_cast<const uint16_t*>(
                   pattern.getBuffer()), pattern.length()));

  const icu::Calendar* calendar = date_format->getCalendar();
  const char* calendar_name = calendar->getType();
  options->Set(v8::String::New("calendar"), v8::String::New(calendar_name));

  // Ugly hack. ICU doesn't expose numbering system in any way, so we have
  // to assume that for given locale NumberingSystem constructor produces the
  // same digits as NumberFormat/Calendar would.
  UErrorCode status = U_ZERO_ERROR;
  icu::NumberingSystem* numbering_system =
      icu::NumberingSystem::createInstance(icu_locale, status);
  const char* system_name = numbering_system->getName();
  options->Set(v8::String::New("numberingSystem"),
               v8::String::New(system_name));

  return handle_scope.Close(options);
}

}  // namespace v8_i18n
