## Dependencies necessary for running the tests ##

  1. GYP build system
  1. ICU library
  1. V8 library

You should checkout Chrome and get all of the dependencies.

### Getting GYP ###

  1. Go to the root of v8-i18n checkout.
  1. Run 'svn co http://gyp.googlecode.com/svn/trunk build/gyp' command.

In case you are getting **ar** errors during linking, you may have hit a problem with
symlinks and ar. Please replace all 'crsT' with 'crs' in gyp generator (removes non-essential support for thin archives):

**build/gyp/pylib/gyp/generator/make.py**:
```
-    arflags_target = 'crsT'
+    arflags_target = 'crs'
```

### Getting Chrome ###

Follow Chromium instructions at http://dev.chromium.org/developers/how-tos/get-the-code but name your checkout folder **chrome** for easier unit testing.

### Generate make files ###

  * build/build\_gyp.py

You can specify Chromium checkout folder with --chrome-dir. It defaults to ../chrome.

### Building ###

Linux:  **make -j30 test-runner**

### Running tests ###

Take a look at README.txt in each of the tests/ subfolders, e.g. tests/test262/README.txt.