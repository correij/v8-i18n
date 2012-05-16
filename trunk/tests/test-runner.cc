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

// Most of the functionality is taken from v8/samples/shell.cc file.

#include <assert.h>
#include <fcntl.h>
#include <string.h>
#include <stdio.h>
#include <stdlib.h>

#include "include/extension.h"
#include "v8/include/v8.h"


v8::Persistent<v8::Context> CreateContext();
bool ExecuteString(v8::Handle<v8::String> source, v8::Handle<v8::Value> name);
void ReportException(v8::TryCatch* handler);
v8::Handle<v8::String> ReadFile(const char* name);
const char* ToCString(const v8::String::Utf8Value& value);

int main(int argc, char* argv[]) {
  if (argc < 2) {
    printf("Usage:\n\ttest-runner file1 file2 ... fileN\n");
    return 1;
  }

  int status = 0;
  {
    // Extra scope so HandleScope can clean up before v8::V8::Dispose.
    // Otherwise we get SEGFAULT.
    v8::HandleScope handle_scope;

    v8::Persistent<v8::Context> context = CreateContext();
    if (context.IsEmpty()) {
      printf("Couldn't create test context.\n");
      return 1;
    }

    context->Enter();

    for (int i = 1; i < argc; ++i) {
      v8::Handle<v8::String> source = ReadFile(argv[i]);
      if (source.IsEmpty()) {
        printf("Error loading file: %s\n", argv[i]);
        status = 1;
        break;
      }
      if (!ExecuteString(source, v8::String::New(argv[i]))) {
        status = 1;
        break;
      }
    }

    context->Exit();
    context.Dispose();
  }

  v8::V8::Dispose();
  return status;
}

// Creates global javascript context with our extension loaded.
v8::Persistent<v8::Context> CreateContext() {
  v8::Handle<v8::ObjectTemplate> global_template = v8::ObjectTemplate::New();

  v8::Extension* extension = v8_i18n::Extension::get();
  v8::RegisterExtension(extension);
  const char* extension_names[] = {extension->name()};
  v8::ExtensionConfiguration extensions(1, extension_names);

  return v8::Context::New(&extensions, global_template);
}

// Executes a string within the current v8 context.
bool ExecuteString(v8::Handle<v8::String> source, v8::Handle<v8::Value> name) {
  v8::HandleScope handle_scope;
  v8::TryCatch try_catch;
  v8::Handle<v8::Script> script = v8::Script::Compile(source, name);
  if (script.IsEmpty()) {
    // Print errors that happened during compilation.
    ReportException(&try_catch);
    return false;
  } else {
    v8::Handle<v8::Value> result = script->Run();
    if (result.IsEmpty()) {
      assert(try_catch.HasCaught());
      // Print errors that happened during execution.
      ReportException(&try_catch);
      return false;
    } else {
      assert(!try_catch.HasCaught());
      return true;
    }
  }
}

// Reports exceptions that happen in compile or execution stage.
void ReportException(v8::TryCatch* try_catch) {
  v8::HandleScope handle_scope;

  v8::String::Utf8Value exception(try_catch->Exception());
  const char* exception_string = ToCString(exception);
  v8::Handle<v8::Message> message = try_catch->Message();
  if (message.IsEmpty()) {
    // V8 didn't provide any extra information about this error; just
    // print the exception.
    printf("%s\n", exception_string);
  } else {
    // Print (filename):(line number): (message).
    v8::String::Utf8Value filename(message->GetScriptResourceName());
    const char* filename_string = ToCString(filename);
    int linenum = message->GetLineNumber();
    printf("%s:%i: %s\n", filename_string, linenum, exception_string);

    // Print line of source code.
    v8::String::Utf8Value sourceline(message->GetSourceLine());
    const char* sourceline_string = ToCString(sourceline);
    printf("%s\n", sourceline_string);

    // Print wavy underline (GetUnderline is deprecated).
    int start = message->GetStartColumn();
    for (int i = 0; i < start; i++) {
      printf(" ");
    }

    int end = message->GetEndColumn();
    for (int i = start; i < end; i++) {
      printf("^");
    }
    printf("\n");

    v8::String::Utf8Value stack_trace(try_catch->StackTrace());
    if (stack_trace.length() > 0) {
      const char* stack_trace_string = ToCString(stack_trace);
      printf("%s\n", stack_trace_string);
    }
  }
}

// Reads a file into a v8 string.
v8::Handle<v8::String> ReadFile(const char* name) {
  FILE* file = fopen(name, "rb");
  if (file == NULL) return v8::Handle<v8::String>();

  fseek(file, 0, SEEK_END);
  int size = ftell(file);
  rewind(file);

  char* chars = new char[size + 1];
  chars[size] = '\0';
  for (int i = 0; i < size;) {
    int read = fread(&chars[i], 1, size - i, file);
    i += read;
  }
  fclose(file);

  v8::Handle<v8::String> result = v8::String::New(chars, size);

  delete[] chars;

  return result;
}

// Extracts a C string from a V8 Utf8Value.
const char* ToCString(const v8::String::Utf8Value& value) {
  return *value ? *value : "<string conversion failed>";
}