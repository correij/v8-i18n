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

import os
import subprocess
import sys


def ListTests(start_dir):
  '''
  Walks the Ecma262 test tree and gathers all intl402 tests.
  '''
  test_root = os.path.join(start_dir, 'data', 'test', 'suite', 'intl402')

  tests = []
  for root, dirs, files in os.walk(test_root):
    if (len(files) == 0):
      continue
    for file in files:
      if file.endswith('.js'):
        tests.append(os.path.join(root, file))
    tests.sort()

  return tests


def main(argv):
  if (len(argv) != 2):
    print 'Usage:\n\tpython run-402-tests.py path/to/test-runner'
    return

  script_dir = os.path.dirname(__file__)

  tests = ListTests(script_dir)

  harness = os.path.join(script_dir, 'data', 'test', 'harness', 'sta.js')
  adapter = os.path.join(script_dir, '..', 'adapter.js')

  for test in tests:
    print 'Testing: ', test
    status = subprocess.call([argv[1], adapter, harness, test])
    if status != 0:
      print 'FAIL'
    else:
      print 'PASS'


if __name__ == '__main__':
  main(sys.argv)
