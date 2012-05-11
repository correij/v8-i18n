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

#include <assert.h>
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#include "include/extension.h"
#include "v8/include/v8.h"

// Creates global text context with our extension loaded.
v8::Persistent<v8::Constext> CreateContext();

int main(int argc, char* argv[]) {
  v8::HandleScope handle_scope;
  v8::Persistent::<v8::Constext> context = CreateContext();
  if (context.IsEmpty()) {
    printf("Couldn't create test context.\n");
    return 1;
  }

  v8::V8::Dispose();
  return 0;
}

v8::Persistent<v8::Constext> CreateContext() {
  v8::Handle<v8::ObjectTemplate> global_template = v8::ObjectTemplate::New();
//  v8::Handle<v8::Object> global_instance = global_template->GetInstance();
  
  return v8::Context::New(NULL, global_template);//, global_instance);
}