Dependencies necessary for running the tests:

1. GYP build system
2. ICU library
3. V8 library

If you are running tests under Chromium you have all them available already.


Getting GYP:

1. Go to the root of v8-i18n checkout.
2. Run 'svn co http://gyp.googlecode.com/svn/trunk build/gyp' command.

In case you are getting ar errors during link, you may have hit a problem with
symlinks and ar. Please patch gyp generator like so (removes non-essential
support for thin archives):

gyp/pylib/generator/make.py:
-    arflags_target = 'crsT'
+    arflags_target = 'crs'


Getting ICU:

svn checkout http://src.chromium.org/chrome/trunk/deps/third_party/icu46 icu


Getting V8:

svn checkout http://v8.googlecode.com/svn/trunk/ v8


Generate make files:

python build/build_gyp.py

You may have to change paths to v8 and icu in the script.


Building:

Linux:  make -j30 test-runner
