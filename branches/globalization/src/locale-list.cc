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

#include "src/locale-list.h"

#include "unicode/uloc.h"
#include "unicode/uversion.h"

namespace v8_i18n {

v8::Handle<v8::Value> JSCanonicalizeLanguageTag(const v8::Arguments& args) {
  v8::HandleScope handle_scope;

  // Expect locale id which is a string.
  if (args.Length() != 1 || !args[0]->IsString()) {
    return v8::ThrowException(v8::Exception::SyntaxError(
        v8::String::New("Locale identifier, as a string, is required.")));
  }

  UErrorCode error = U_ZERO_ERROR;

  char icu_result[ULOC_FULLNAME_CAPACITY];
  int icu_length = 0;

  // Return value which denotes invalid language tag.
  const char* const kInvalidTag = "invalid-tag";

  v8::String::AsciiValue localeID(args[0]->ToString());

  uloc_forLanguageTag(*localeID, icu_result, ULOC_FULLNAME_CAPACITY,
                      &icu_length, &error);
  if (U_FAILURE(error) || icu_length == 0) {
    return v8::String::New(kInvalidTag);
  }

  char result[ULOC_FULLNAME_CAPACITY];

  // Force strict BCP47 rules.
  uloc_toLanguageTag(icu_result, result, ULOC_FULLNAME_CAPACITY, TRUE, &error);

  if (U_FAILURE(error)) {
    return v8::String::New(kInvalidTag);
  }

  return v8::String::New(result);
}

}  // namespace v8_i18n
