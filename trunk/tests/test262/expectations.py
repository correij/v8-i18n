#!/usr/bin/python
#
# Copyright 2012 the v8-i18n authors.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#    http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

# Bugs
expect_fail = {
  'data/test/suite/intl402/ch11/11.2/11.2.1.js': 'FAIL',
  'data/test/suite/intl402/ch11/11.3/11.3.js': 'FAIL',
  'data/test/suite/intl402/ch12/12.2/12.2.1.js': 'FAIL',
  'data/test/suite/intl402/ch12/12.3/12.3.2_3.js': 'FAIL',
  'data/test/suite/intl402/ch12/12.3/12.3.2_5_b.js': 'FAIL',
  'data/test/suite/intl402/ch12/12.3/12.3.js': 'FAIL',
  'data/test/suite/intl402/ch13/13.2/13.2.1.js': 'FAIL',
  'data/test/suite/intl402/ch13/13.3/13.3.js': 'FAIL'
}

# Deliberate incompatibilities
incompatible = {
}