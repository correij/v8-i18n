# Introduction #
Formatting dates is a complex, locale sensitive operation.

## Intl vs. v8Intl ##
You can use both Intl and v8Intl global objects for now, but our plan is to remove support for v8Intl in the future.

## Settings ##
DateTimeFormat constructor accepts optional locale array and optional settings object.<br>
Settings object and valid values for all the keys:<br>
<pre><code>weekday: {'narrow', 'short', 'long'}<br>
era: {'narrow', 'short', 'long'}<br>
year: {'2-digit', 'numeric'}<br>
month: {'2-digit', 'numeric', 'narrow', 'short', 'long'}<br>
day: {'2-digit', 'numeric'}<br>
hour: {'2-digit', 'numeric'}<br>
minute: {'2-digit', 'numeric'}<br>
second: {'2-digit', 'numeric'}<br>
timeZoneName: {'short', 'long'}<br>
tz: {undefined, 'UTC'}  // Undefined represents local time zone.<br>
hour12: {true/false}  // Use 12 or 24h format.<br>
</code></pre>

Other formatting properties can be passed using Unicode extensions:<br>
<pre><code>Key    Property            Type       Values<br>
ca     calendar            "string"   "gregory", ...<br>
nu     numberingSystem     "string"   "thai", ...<br>
</code></pre>

<h2>Default locale</h2>
The safest approach is to specify target locale and check if it was available through resolvedOptions method.<br>
<br>
<h2>Default settings</h2>
<pre><code>day: 'numeric'<br>
month: 'numeric'<br>
year: 'numeric'<br>
</code></pre>

Other options are locale specific. For example, hour12 is set by locale to either true or false.<br>
<br>
<h2>Methods</h2>
<pre><code>/**<br>
 * Returns a string that represents dateValue given the pattern and<br>
 * locale data.<br>
 */<br>
format(dateValue)<br>
<br>
/**<br>
 * This method is not part of the ECMAScript 402 specification, and it<br>
 * can change in the future.<br>
 * Returns Date object that represents dateString, or<br>
 * undefined in case of failure.<br>
 */<br>
v8Parse(dateString) <br>
</code></pre>

<h2>Time zone handling</h2>
Our implementation supports additional time zones, besides 'UTC' and undefined (local). One can use IANA time zone names, like 'America/Los_Angeles', 'Etc/GMT'...<br>
<br>
If unsupported zone was specified, DateTimeFormat constructor will throw RangeError exception.<br>
<br>
<h2>DateTimeFormat with default locale and settings</h2>
<pre><code>var dtf = Intl.DateTimeFormat();<br>
dtf.format();  // Returns a string representing now().<br>
</code></pre>

<h2>DateTimeFormat with user locale and default settings</h2>
<pre><code>var dtf = Intl.DateTimeFormat(['sr-rs', 'fr-CA', 'de-de']);<br>
dtf.format();<br>
</code></pre>

<h2>DateTimeFormat with user locale and settings</h2>
<pre><code>var dtf = Intl.DateTimeFormat(['sr-rs', 'fr-CA', 'de-de'], {hour:'2-digit', minute:'2-digit'});<br>
dtf.format(new Date(1974, 7, 29, 12, 15, 0));<br>
</code></pre>

<h2>DateTimeFormat with default locale and user settings</h2>
<pre><code>var dtf = Intl.DateTimeFormat([], {hour:'2-digit', minute:'2-digit'});<br>
dtf.format(new Date(1974, 7, 29, 12, 15, 0));<br>
</code></pre>

<h2>DateTimeFormat with user locale and Unicode extension</h2>
<pre><code>var dtf = Intl.DateTimeFormat(['th-u-nu-thai']);<br>
dtf.format();<br>
</code></pre>

<h2>DateTimeFormat used for parsing</h2>
<pre><code>var dtf = Intl.DateTimeFormat(['en']);<br>
dtf.parse('4/5/74');<br>
</code></pre>