# JavaScript Scrollable Table

BSJSTable is a widget that can be used in HTML5 web-pages to display tabular data. BSJSTable adds functionality, such as scrollable view area and resizable columns to the basic HTML5 table element. The logic is implemented using JavaScript.

## Features

The BSJSTable implementation has the following key features:

* Scrollable content with a static table header always displayed at the top of the content area.
* Resizable columns.
* Dynamic table layout based on the relative column widths. The table can be dynamically resized, for example, as a result of the browser window resizing.
* View configuration - relative column widths, data sorting - is stored locally in the browser local storage, so that the table is always displayed in the same way it was left by the user last time.
* The content is loaded asynchronously using AJAX technology. The data is represented using JSON.
* An attempt was made to make the implementation "lean" and fast.
* The table structure is represented by the standard HTML5 table elements and sub-elements, so that the browser "sees" the widget as a table (as opposed to a bunch of "divs" as in some other scrollable table implementations).
* The table appearance is highly customizable using CSS.

### Resizing Columns

The user can change the default table column widths using the mouse and dragging the column edges in the table header.

There are two distinctive modes for resizing the table columns. If a user starts resizing a table column where the table is taking 100% of its display area width, the table logic will try to preserve the table's 100% width by proportionately resizing other columns in the table. This allows the user to see the whole width of the table content before and after the column resize. Only if the minimum widths of the columns to the right from the column being resized are reached, the table switches to the alternative column resize mode, in which only one column changes its width, while all other columns preserve their current pixel width. In this alternative mode, the width of the whole table may become more than 100% of its view area, triggering the appearance of a horizontal scrollbar, but the table can never be made less than 100% of its view area.

The alternative column resize mode is always used if the table width is currently more than 100% of its view area. The alternative mode can also be forced by the user if the user presses the Shift key when resizing the column.

### Content Sorting

The table allows the sorting of its content by multiple columns. When the user clicks a column header, the table sends an AJAX request back to the server and asks it to sort the data by the clicked column. Clicking on the header multiple times toggles between ascending and descending order.

If the user clicks on a header with the Ctrl key pressed, the column is added to the list of columns used to sort the data. This allows sorting data by multiple columns at once. The order, in which the columns are clicked is important: the data is sorted first by the first column clicked, then the following column, etc.

## Table Setup

To add a table to a page, the following steps need to be taken:

First, in the page head, include the BSJS.js file containing the table JavaScript logic and the BSJS.css stylesheet with the essential CSS code:

```html
...
<head>
    ...
    <link rel="stylesheet" href="BSJS.css" type="text/css"/>
    <script type="text/javascript" src="BSJS.js"></script>
    ...
</head>
...
```

Usually, after including the essential BSJS.css, a custom CSS stylesheet is included that customizes the table look. Customizing the table look using CSS is discussed [later in this manual](#customizing-table-appearance).

The BSJS files can be downloaded from here:

http://www.boylesoftware.com/bsjs/release/BSJS.js<br/>
http://www.boylesoftware.com/bsjs/release/BSJS.css

For performance reasons, it is recommended to include these files in your web-site instead of sourcing them directly from the Boyle Software site.

Second, the table element is placed in the page body and given an id:

```html
...
<table id="myDataTable"></table>
...
```

The table element can be placed on the page and given a size using normal HTML5 and CSS techniques. The scrollable table will occupy the whole width and height of its container. The container does not have to have a fixed size. It can be dynamic and resize together with the browser window. The table is designed to adjust accordingly.

Lastly, the table needs to be configured using a JavaScript call, which normally follows immediately after the table element:

```html
...
<table id="myDataTable"></table>
<script type="text/javascript">
BSJS.table(
    "MyData",
    "myDataTable",
    "/data/data.json",
    [
        {
            id: "col1",
            title: "Column 1",
            defaultWidth: 10,
            defaultSort: "asc"
        },
        {
            id: "col2",
            title: "Column 2",
            defaultWidth: 50
        },
        {
            id: "col3",
            title: "Column 3",
            defaultWidth: 35
        },
        {
            id: "col4",
            title: "Column 4",
            defaultWidth: 5,
            format: function(val) { return (val ? "&#x2713;" : ""); }
        }
    ]);
</script>
...
```

The `BSJS.table` function has the following signature:

```javascript
BSJS.table(tableId, tableElementId, url, columns[, resources])
```

And the parameters are:

* **tableId**

	The table id. This is unique for the whole web-site and is used, in particular, to form keys in the browser local storage for the table view configuration.

* **tableElementId**

	The table HTML element id. This id, as opposed to the *tableId*, is unique within the page, but does not have to be unique for the whole web-site.

* **url**

	This is the URL for the table JSON data. The table calls this URL asynchronously when it is loaded and when the sorting is changed. The table adds a request parameter named "s" containing the requested sorting information. The format of the "s" parameter is discussed [later in this manual](#the-data).

* **columns**

	This is an array with column definition objects. Each element in the array adds a column to the table. The definition objects have the following fields:

	* **id**

		The column id used to identify the column for the back-end. The id should be a simple, short value similar to a JavaScript variable or a request parameter name.

	* **title**

		The column title displayed to the user in the table header row.

	* **defaultWidth**

		Default column width in percentages. This width is used if the column has never been resized by the user. The width percentages for all columns *must* add up to 100.

	* **defaultSort** *(optional)*

		If specified, the table is sorted using the column by default until the user changes the sorting for the first time. The values are "asc" and "desc". Multiple columns can have the *defaultSort* property.

	* **format** *(optional)*

		Function used to format cell values to HTML. The function takes one parameter - the cell value from the JSON data - and returns the HTML to include in the table cell. If not specified, the default behavior is to escape any HTML special characters in the cell JSON value ("&", "<" and ">") and return the result.

* **resources** *(optional)*

	Various table implementation resources, such as messages, labels, etc. If not specified, a set of default resources is used. The value of the parameter is an object, where each field is a named resource. The following resources are defined:

	* **message.noData**

		Message displayed in the table content area when the back-end returns no data. The default value is "No data.".

	* **message.loading**

		Message temporarily displayed in the table content area while the table is waiting for a response from the back-end. The default is "Loading&amp;hellip;" ("Loading&hellip;").

	* **label.sortAsc**

		Label for the indicator in the table header showing that the table is sorted by this column and the order is ascending. The default is "&amp;#x25b2;", which is a triangle pointing up ("&#x25b2;").

	* **label.sortDesc**

		Label for the indicator in the table header showing that the table is sorted by this column and the order is descending. The default is "&amp;#x25bc;", which is a triangle pointing down ("&#x25bc;").

Alternatively, instead of overriding resources in the `BSJS.table` parameter, the defaults can be modified by setting the appropriate keys in the global `BSJS.defaultResources` object.

## The Data

The data is provided to the table by the back-end in a form of JSON. The table makes an AJAX call to the specified to the `BSJS.table` function *url* parameter. To the URL, it adds a request parameter called "s" with the information about requested data sorting. The value of the parameter is a comma-separated list of elements, one for each column to use for sorting. Each element is a column id followed by a colon and either word "asc" or "desc". For example:

```
http://myserver.com/data/content.json?s=id:asc,name:desc
```

The back-end response should have content type *application/json*. The structure of the response is following:

```
{
    "sorting": {
        "<column id>": "asc|desc",
        "<column id>": "asc|desc",
        ...
    },
    "data": [
        {
            "<column id>": <row 1 column value>,
            "<column id>": <row 1 column value>,
            ...
        },
        {
            "<column id>": <row 2 column value>,
            "<column id>": <row 2 column value>,
            ...
        },
        ...
    ]
}
```

For example:

```json
{
    "sorting": {
        "id": "asc"
    },
    "data": [
        {
            "id": 1,
            "name": "George Washington",
            "startDate": "1789-04-30",
            "twoTerm": true
        },
        {
            "id": 2,
            "name": "John Adams",
            "startDate": "1797-03-04",
            "twoTerm": false
        },
        {
            "id": 3,
            "name": "Thomas Jefferson",
            "startDate": "1801-03-04",
            "twoTerm": true
        }
    ]
}
```

## Customizing Table Appearance

The essential BSJS.css stylesheet contains a very basic, functional (but probably unsatisfactory) default style for the tables. The majority of the web-sites will want to customize the look. This customization is performed using CSS.

### Table HTML Structure

First, let's have a look at the HTML structure generated by JavaScript for the tables. After the table is initialized and loaded it looks like this:

```html
...
<!-- The original table element is wrapped into two divs to provide scrolling -->
<div class="BSJSScrollableTable">
    <!-- This div contains the scrollable area of the table -->
    <div class="BSJSScrollableArea">
        <!-- The original table element with the element id -->
        <table id="myTable">
            <!-- Used internally to set column widths -->
            <colgroup>
                <col/> <!-- a col element for each column -->
                ...
            </colgroup>
            <!-- This is the table header, absolutely positioned outside the scrollable area
                 and always displayed regardless of the content area scrolling -->
            <thead>
                <tr>
                    <th> <!-- a th element for each column -->
                        <div>
                            <div class="BSJSHeaderTitle">Column Title</div>
                            <div class="BSJSHeaderControl">
                                <div class="BSJSSortingAscSymbol">&#x25b2;</div>
                                <div class="BSJSSortingDescSymbol">&#x25bc;</div>
                            </div>
                        </div>
                    </th>
                    ...
                </tr>
            </thead>
            <!-- This is the table content -->
            <tbody>
                <tr> <!-- a tr element for each table row -->
                    <td> <!-- a td element for each column -->
                        <div>Cell Value</div>
                    </td>
                    ...
                </tr>
                ...
            </tbody>
        </table>
    </div>
    <!-- An invisible table used internally for correct table sizing -->
    <table class="BSJSModel">
        <thead>
            <!-- Repeats the content of the main table thead section -->
            ...
        </thead>
    </table>
    <!-- Initially invisible div overlayed over the table content area when the table is
         waiting for the back-end response -->
    <div class="BSJSSplash">
        <div>Loading&hellip;</div>
    </div>
</div>
...
```

In addition, each `th` element in the table header (in both the main table and the "BSJSModel") may have either "BSJSSortingAsc" or "BSJSSortingDesc" class is the data is sorted by the column.

Also, when the back-end returns no data, the `tbody` element contain a single row with a spanned `td` and the "no data" message:

```html
...
<tbody>
    <tr class="BSJSEmpty">
        <td colspan="10"> <!-- assuming the table has 10 columns -->
            <div>No data.</div>
        </td>
    </tr>
</tbody>
...
```

Given this structure, this is an example of how the table may be customized:

```css
/* outside whole table border */
.BSJSScrollableTable {
        border: 1px solid black;
}

/* table font */
.BSJSScrollableTable {
        font-family: Arial, sans-serif;
        font-size: 12px;
}

/* configure table header */
.BSJSScrollableTable th {
        font-style: italic;
        background-color: #739fd0;
        padding: 4px 6px;
        border-right: 2px groove #739fd0;
}
.BSJSScrollableTable .BSJSSortingAscSymbol,
.BSJSScrollableTable .BSJSSortingDescSymbol {
        display: block;
        color: gray;
        padding: 0px 2px;
        font-size: x-small;
        font-style: normal;
        line-height: 2ex;
}
.BSJSScrollableTable .BSJSSortingAsc .BSJSSortingAscSymbol {
        color: lightgreen;
}
.BSJSScrollableTable .BSJSSortingDesc .BSJSSortingDescSymbol {
        color: lightgreen;
}

/* table cells */
.BSJSScrollableTable td {
        padding: 1px 6px;
        border-right: 2px groove silver;
}

/* special alignment for certain columns */
.BSJSScrollableTable td:nth-child(1) {
        text-align: right;
}
.BSJSScrollableTable td:nth-child(5),
.BSJSScrollableTable td:nth-child(6) {
        text-align: center;
}

/* alternating rows */
.BSJSScrollableTable tr:nth-child(odd) {
        background-color: lightgray;
}
```

Enjoy and check back regularly for new versions and additional features!
