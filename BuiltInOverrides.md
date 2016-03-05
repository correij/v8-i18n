# Introduction #
In the past built-in methods:
```
Date.prototype.toLocaleString
Date.prototype.toLocaleTimeString
Date.prototype.toLocaleDateString
Number.prototype.toLocaleString
String.prototype.localeCompare
```
were mostly useless because:
  * They weren't cross browser compatible.
  * Results on some browsers were for English only no matter what the underlying locale was.

## New declaration of the methods ##
Chapter 13 of Ecma 402 spec adds two new optional parameters to each of the methods, locale list and options.
```
Date.prototype.toLocaleString(optLocales, optOptions)
```
Locale parameter and options parameter match corresponding constructor parameters for DateTimeFormat, NumberFormat and Collator objects.

## Speed concerns ##
The optimal way of using the API is through dedicated Intl.{Collator|NumberFormat|DateTimeFormat|...} objects. Using built-in overrides slows things considerably in some cases. We did optimize the most common case (no parameters) and it's within 20% of the optimum.

## Change in default behavior ##
This library overrides default behavior of the above mentioned methods. Default behavior matches defaults of the DateTimeFormat, NumberFormat and Collator constructors.

For example, Chrome date formatting shows drastic change in the output (but with correct results):

Locale: en
|Date.prototype.toLocaleString|Wed Oct 03 2012 14:05:01 GMT-0700 (PDT)|10/3/2012 2:01:05 PM|
|:----------------------------|:--------------------------------------|:-------------------|
|Date.prototype.toLocaleDateString|Wednesday, October 03, 2012            |10/3/2012           |
|Date.prototype.toLocaleTimeString|14:01:05                               |2:01:05 PM          |
|Number.prototype.toLocaleString|1234567890.123434                      |1,234,567,890.123   |

Locale: de
|Date.prototype.toLocaleString|Wed Oct 03 2012 14:05:01 GMT-0700 (PDT)|3.10.2012 14:01:05|
|:----------------------------|:--------------------------------------|:-----------------|
|Date.prototype.toLocaleDateString|Wednesday, October 03, 2012            |3.10.2012         |
|Date.prototype.toLocaleTimeString|14:01:05                               |14:01:05          |
|Number.prototype.toLocaleString|1234567890.123434                      |1.234.567.890,123 |

## User specified behavior ##
User can add or subtract options to the default behavior with the extra parameters.
See DateTimeFormat, NumberFormat or Collator pages for details and examples.