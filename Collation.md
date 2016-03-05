# Introduction #
Sorting strings is a complex, locale sensitive operation.

## Intl vs. v8Intl ##
You can use both Intl and v8Intl global objects for now, but our plan is to remove support for v8Intl in the future.

## Settings ##
Collator constructor accepts optional locale array and optional settings object.<br>
Settings object and valid values for all the keys:<br>
<pre><code>usage: {'sort', 'search'}<br>
sensitivity: {'base', 'accent', 'case', 'variant'}<br>
ignorePunctuation: {true, false}<br>
numeric: {true, false}<br>
caseFirst: {'upper', 'lower', 'false'}<br>
</code></pre>

Other collation properties can be passed using Unicode extensions:<br>
<pre><code>Key    Property            Type       Values<br>
kn     numeric             "boolean"  true/false<br>
kf     caseFirst           "string"   "upper", "lower", "false"<br>
</code></pre>

Normalization of input strings is on by default, and cannot be changed by the caller.<br>
<br>
<h2>Default locale</h2>
The safest approach is to specify target locale and check if it was available through resolvedOptions method.<br>
<br>
<h2>Default settings</h2>
<pre><code>usage: 'sort'<br>
ignorePunctuation: false<br>
sensitivity: 'variant' // For usage:'sort', it's locale dependent for usage:'search'<br>
</code></pre>

<h2>Collator with default locale and settings</h2>
<pre><code>var array = ['d', 'a', 'b', 'c'];<br>
var coll = Intl.Collator();<br>
array.sort(coll.compare);<br>
</code></pre>

<h2>Collator with user locale and default settings</h2>
<pre><code>var array = ['d', 'a', 'b', 'c'];<br>
var coll = Intl.Collator(['sr-rs', 'de-u-co-phonebk']);<br>
array.sort(coll.compare);<br>
</code></pre>

<h2>Collator with user locale and settings</h2>
<pre><code>var array = ['d', 'a', 'b', 'c'];<br>
// Create collator sensitive to difference in base letters, a != b,<br>
// and to accents, a != á.<br>
var coll = Intl.Collator(['sr-rs', 'de-u-co-phonebk'], {sensitivity:'accent'});<br>
array.sort(coll.compare);<br>
</code></pre>

<h2>Collator with default locale and user settings</h2>
<pre><code>var array = ['d', 'a', 'b', 'c'];<br>
// Create collator sensitive to difference in base letters, a != b,<br>
// and to accents, a != á.<br>
var coll = Intl.Collator([], {sensitivity:'accent'});<br>
array.sort(coll.compare);<br>
</code></pre>

<h2>Collator with user locale and Unicode extension</h2>
<pre><code>var array = ['d', 'a', 'b', 'c'];<br>
// Turn on numeric sort so '1' sorts before '12'.<br>
var coll = Intl.Collator(['sr-u-kn-true']);<br>
array.sort(coll.compare);<br>
</code></pre>