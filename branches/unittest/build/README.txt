Dependencies necessary for running the tests:

1. GYP build system
2. ICU library
3. V8 library

If you are running tests under Chromium you have all them available already.


Getting GYP:

1. Go to the root of v8-i18n checkout.
2. Run 'svn co http://gyp.googlecode.com/svn/trunk build/gyp' command.
3. Tweak gyp/pylib/generator/make.py:
-    arflags_target = 'crsT'
+    arflags_target = 'crs'

For some reason ar archiver gets confused with .. in the dependency path,
and creates invalid 'T'hin archive.


Getting ICU:

svn checkout http://src.chromium.org/chrome/trunk/deps/third_party/icu46 icu


Getting V8:

svn checkout http://v8.googlecode.com/svn/trunk/ v8


Generate make files:

python build/build_gyp.py

You may have to change paths to v8 and icu in the script.


Building:

Linux:  make -j30 test-runner


Running the tests:

test-runner path-to-tests
