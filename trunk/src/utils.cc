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

#include "src/utils.h"

#include <string.h>

#include "unicode/unistr.h"

namespace v8_i18n {

// static
void Utils::StrNCopy(char* dest, int length, const char* src) {
  if (!dest || !src) return;

  strncpy(dest, src, length);
  dest[length - 1] = '\0';
}

// static
bool Utils::ExtractStringSetting(const v8::Handle<v8::Object>& settings,
                                 const char* setting,
                                 icu::UnicodeString* result) {
  if (!setting || !result) return false;

  v8::HandleScope handle_scope;
  v8::TryCatch try_catch;
  v8::Handle<v8::Value> value = settings->Get(v8::String::New(setting));
  if (try_catch.HasCaught()) {
    return false;
  }
  // No need to check if |value| is empty because it's taken care of
  // by TryCatch above.
  if (!value->IsUndefined() && !value->IsNull() && value->IsString()) {
    v8::String::Utf8Value utf8_value(value);
    if (*utf8_value == NULL) return false;
    result->setTo(icu::UnicodeString::fromUTF8(*utf8_value));
    return true;
  }
  return false;
}

// static
void Utils::AsciiToUChar(const char* source,
                         int32_t source_length,
                         UChar* target,
                         int32_t target_length) {
  int32_t length =
      source_length < target_length ? source_length : target_length;

  if (length <= 0) {
    return;
  }

  for (int32_t i = 0; i < length - 1; ++i) {
    target[i] = static_cast<UChar>(source[i]);
  }

  target[length - 1] = 0x0u;
}

}  // namespace v8_i18n
