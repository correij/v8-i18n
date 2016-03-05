# Introduction #
**Intl.v8BreakIterator class is not a part of Ecma 402 standard, and it can change in the future.**

Break iterator segments text into words given the rules of current locale.

For most Western languages breaks occur at white space or interpunction
characters, but some Eastern languages don't have those. In those cases segmenter uses dictionaries and rules to break text into parts.

## Intl vs. v8Intl ##
You can use both Intl and v8Intl global objects for now, but our plan is to remove support for v8Intl in the future.

# Settings #
v8BreakIterator constructor accepts optional locale array and optional settings object.
Settings object and valid values for all the keys:
```
type: {'character', 'word', 'sentence', 'line'}
```

# Default locale #
The safest approach is to specify target locale and check if it was available through resolvedOptions method.

# Default settings #
```
type: 'word'
```

# Methods #
```
first()  // Returns index of the first break and moves pointer to it.

next()  // Returns index of the next break and moves pointer to it.

current()  // Returns index of the current break.

adoptText()  // Assigns text to be segmented to the iterator.

breakType()  // Returns the type of the break - 'none', 'number', 'letter', 'kana', 'ideo' or 'unknown'.
```

## How to use ##
```
var iterator = Intl.v8BreakIterator(['en']);

var text = 'Jack and Jill, went over hill!';
iterator.adoptText(text);

var pos = iterator.first();
while (pos !== -1) {
  var nextPos = iterator.next();
  if (nextPos === -1) break;

  var slice = text.slice(pos, nextPos);
  var type = iterator.breakType();

  // Output/use slice and type.
}
```