// Copyright 2012 the v8-i18n authors.
//
// Licensed under the Apache License, Version 2.0 (the 'License');
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

// Invalid input is handled properly.

var nf = new Intl.NumberFormat(['en']);

assertEquals(undefined, nf.parse(''));
assertEquals(undefined, nf.parse('A'));
assertEquals(undefined, nf.parse(new Date()));
assertEquals(undefined, nf.parse(undefined));
assertEquals(undefined, nf.parse(null));
assertEquals(undefined, nf.parse());
assertEquals(undefined, nf.parse('Text before 12345'));

