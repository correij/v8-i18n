# Introduction #
Formatting numbers is a complex, locale sensitive operation.

## Intl vs. v8Intl ##
You can use both Intl and v8Intl global objects for now, but our plan is to remove support for v8Intl in the future.

## Settings ##
NumberFormat constructor accepts optional locale array and optional settings object.<br>
Settings object and valid values for all the keys:<br>
<pre><code>style: {'decimal', 'percent', 'currency'}<br>
currency: {'USD', 'RSD', ...} // ISO 4217 3-letter currency code. Currency has to be specified if style: 'currency'.<br>
currencyDisplay: {'code', 'symbol', 'name'}<br>
numberingSystem: {'latn', 'thai', ...} // Numbering system listed in TR#35<br>
minimumIntegerDigits: {0, 1,...}<br>
minimumFractionDigits: {0, 1,...}<br>
maximumFractionDigits: {0, 1,...}<br>
minimumSignificantDigits: {0, 1,...}<br>
maximumSignificantDigits: {0, 1,...}<br>
</code></pre>

Other formatting properties can be passed using Unicode extensions:<br>
<pre><code>Key    Property            Type       Values<br>
nu     numberingSystem     "string"   "thai", ...<br>
</code></pre>

<h2>Default locale</h2>
The safest approach is to specify target locale and check if it was available through resolvedOptions method.<br>
<br>
<h2>Default settings</h2>
<pre><code>style: 'decimal'<br>
</code></pre>

Other options are locale specific.<br>
<br>
<h2>Methods</h2>
<pre><code>/**<br>
 * Returns a string given the number. String is formatted using<br>
 * the pattern and locale data provided in the constructor.<br>
 */<br>
format(number)<br>
<br>
/**<br>
 * This method is not part of the ECMAScript 402 specification and can change at any time.<br>
 * Returns the number given the string representation of that number, or<br>
 * it returns undefined if the string can't be parsed.<br>
 * Due to limitation of the underlying library we don't support currency parsing at this time.<br>
 */<br>
v8Parse(string)<br>
</code></pre>

<h2>NumberFormat with default locale and settings</h2>
<pre><code>var nf = Intl.NumberFormat();<br>
nf.format(12345.67);  // Returns a string.<br>
</code></pre>

<h2>NumberFormat with user locale and default settings</h2>
<pre><code>var nf = Intl.NumberFormat(['sr', 'de', 'fr']);<br>
nf.format(12345.67);<br>
</code></pre>

<h2>NumberFormat with user locale and settings</h2>
<pre><code>var nf = Intl.NumberFormat(['sr', 'de', 'fr'], {style:'currency', currency:'RSD', currencyDisplay:'code'});<br>
nf.format(12345.67);<br>
</code></pre>

<h2>NumberFormat with default locale and user settings</h2>
<pre><code>var nf = Intl.NumberFormat([], {style:'currency', currency:'RSD', currencyDisplay:'code'});<br>
nf.format(12345.67);<br>
</code></pre>

<h2>NumberFormat with user locale and Unicode extension</h2>
<pre><code>var nf = Intl.NumberFormat(['th-u-nu-thai']);<br>
nf.format(12345.67);<br>
</code></pre>

<h2>NumberFormat used to parse</h2>
<pre><code>var nf = Intl.NumberFormat(['en']);<br>
nf.parse('123,45.67');<br>
</code></pre>