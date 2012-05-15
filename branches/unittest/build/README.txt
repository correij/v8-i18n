Dependencies necessary for running the tests:

1. GYP build system
2. ICU library
3. V8 library

If you are running tests under Chromium you have all them available already.


Getting GYP:

1. Go to the root of v8-i18n checkout.
2. Run 'svn co http://gyp.googlecode.com/svn/trunk build/gyp' command.


Getting ICU:

svn checkout http://src.chromium.org/chrome/trunk/deps/third_party/icu46 icu


Getting V8:

svn checkout http://v8.googlecode.com/svn/trunk/ v8


Generate your project files (assuming v8, icu and v8-i18n are at the same level):

build/gyp/gyp --depth . -Dv8_path=../.. -Dicu_path=../../icu \
-Dicu_use_data_file_flag -Dwerror= -Dv8_use_snapshot \
-I../v8/build/standalone.gypi -Ibuild/common.gypi build/unittest.gyp

-depth points to the root
-Dicu_path points to icu/icu.gyp
-Dv8_path points to v8 checkout
-Dwerror allows ICU to compile with some warnings
-Dv8_use_snapshot makes v8_base show up in deps. chain before v8_snapshot
-Dicu_use_data_file_flag - don't compile data file, just use existing one
-I../v8/build/standalone.gypi points to gyp variables needed for standalone build
-Ibuild/common.gypi points to gyp variables needed for icu to build (use in non-Chromium builds)

Building:

Linux:  make -j30 test-runner
Mac OS: xcodebuild -project build/unittest.xcodeproj -configuration Release -target test-runner


Running the tests:

test-runner path-to-tests
