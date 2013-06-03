//
// BSJS Widgets Library
//
// version 1.0.1
//
// Created by Lev Himmelfarb
// Copyright (c) 2013 Boyle Software, Inc. All rights reserved.
//

var BSJS = {

	table: function(id, elementId, dataUrl, columns, resources) {

		var tbl = new BSJSTable(id, elementId, dataUrl, columns, resources);
		tbl.show();
	},

	round2: function(num) {

		return Math.round(num * 100) / 100;
	},

	escapeHtml: function(str) {

		return str
			.replace(/&/g, "&amp;")
			.replace(/</g, "&lt;")
			.replace(/>/g, "&gt;");
	},

	pixelWidthToPercentWidth: function(el, pxlPct) {

		var res;

		var tw = el.getBoundingClientRect().width;
		var basePct = tw * pxlPct;
		el.style.width =
			String(res = BSJS.round2(basePct)) + "%";
		var cw = el.getBoundingClientRect().width;
		var diff = tw - cw;
		var diffMod = Math.abs(diff);
		if (diffMod > 0.1) {
			var initDiffSign = diff / diffMod;
			var dPct = (diff + 1.5 * initDiffSign) * pxlPct;
			var ddPct = dPct;
			var n = 0;
			while (true) {
				el.style.width =
					String(res = BSJS.round2(basePct + dPct)) + "%";
				cw = el.getBoundingClientRect().width;
				diff = tw - cw;
				diffMod = Math.abs(diff);
				if ((diffMod < 0.1) || (n++ > 10))
					break;
				var diffSign = diff / diffMod;
				ddPct /= 2;
				dPct += ddPct * diffSign * initDiffSign;
			}
		}

		return res;
	},

	defaultResources: {
		"message.noData": "No data.",
		"message.loading": "Loading&hellip;",
		"label.sortAsc": "&#x25b2;",
		"label.sortDesc": "&#x25bc;"
	}
};

function BSJSTable(id, elementId, dataUrl, columns, resources) {

	this._id = id;
	this._elementId = elementId;
	this._dataUrl = dataUrl;
	this._columns = [];
	this._resources = (resources ? resources : BSJS.defaultResources);

	this._empty = true;

	var key = "BSJSTable_" + this._id + "_width";
	this._width = (localStorage[key] ? Number(localStorage[key]) : 100);
	var defaultSortingStr = "";
	var defaultFormatFunc =
		function(val) { return BSJS.escapeHtml(String(val)); };
	for (var i = 0; i < columns.length; i++) {
		var col = columns[i];
		key = "BSJSTable_" + this._id + "_" + col.id + "_width";
		this._columns.push({
			id: col.id,
			width: (localStorage[key] ?
						Number(localStorage[key]) : col.defaultWidth),
			format: (col.format ? col.format : defaultFormatFunc)
		});
		if (col.defaultSort) {
			if (defaultSortingStr.length > 0)
				defaultSortingStr += ",";
			defaultSortingStr += col.id + ":" + col.defaultSort;
		}
	}
	key = "BSJSTable_" + this._id + "_sorting";
	var sortingStr =
		(localStorage[key] ? localStorage[key] : defaultSortingStr);
	var sortingStrParts = sortingStr.split(",");
	this._sorting = {};
	for (var i = 0; i < sortingStrParts.length; i++) {
		var p = sortingStrParts[i].split(":");
		this._sorting[p[0]] = p[1];
	}

	this._lastColInd = this._columns.length - 1;

	this._tblEl = document.getElementById(this._elementId);
	if (this._tblEl.nodeName != "TABLE")
		throw "The element must be a TABLE.";
	this._topEl = document.createElement("DIV");
	this._topEl.className = "BSJSScrollableTable";
	this._tblEl.parentNode.replaceChild(this._topEl, this._tblEl);
	this._scrEl = document.createElement("DIV");
	this._scrEl.className = "BSJSScrollableArea";
	this._topEl.appendChild(this._scrEl);
	this._scrEl.appendChild(this._tblEl);
	this._colGrpEl = document.createElement("COLGROUP");
	this._tblEl.appendChild(this._colGrpEl);
	this._tblEl.createTHead();
	this._hdrRowEl = this._tblEl.tHead.insertRow(-1);
	this._mdlEl = document.createElement("TABLE");
	this._mdlEl.className = "BSJSModel";
	this._mdlEl.createTHead();
	this._mdlRowEl = this._mdlEl.tHead.insertRow(-1);
	this._topEl.appendChild(this._mdlEl);
	var rsrc = this._resources;
	var createHeaderCell = function(cellInd) {
		var cellEl = document.createElement("TH");
		var divEl = document.createElement("DIV");
		var ttlEl = document.createElement("DIV");
		ttlEl.className = "BSJSHeaderTitle";
		ttlEl.appendChild(document.createTextNode(columns[cellInd].title));
		divEl.appendChild(ttlEl);
		var ctlEl = document.createElement("DIV");
		ctlEl.className = "BSJSHeaderControl";
		ctlEl.innerHTML =
			"<div class=\"BSJSSortingAscSymbol\">" +
				rsrc["label.sortAsc"] + "</div>" +
			"<div class=\"BSJSSortingDescSymbol\">" +
				rsrc["label.sortDesc"] + "</div>";
		divEl.appendChild(ctlEl);
		cellEl.appendChild(divEl);
		return cellEl;
	};
	for (var i = 0; i <= this._lastColInd; i++) {
		this._colGrpEl.appendChild(document.createElement("COL"));
		this._hdrRowEl.appendChild(createHeaderCell(i));
		this._mdlRowEl.appendChild(createHeaderCell(i));
	}
	//this._tblEl.createTBody(); // unsupported in FF
	this._tblEl.appendChild(document.createElement("TBODY"));
	this._ldrEl = document.createElement("DIV");
	this._ldrEl.className = "BSJSSplash";
	var divEl = document.createElement("DIV");
	divEl.innerHTML = this._resources["message.loading"];
	this._ldrEl.appendChild(divEl);
	this._topEl.appendChild(this._ldrEl);

	this._mdlEl.style.width = "1px";
	this._colMinWidths = [];
	for (var i = 0; i <= this._lastColInd; i++) {
		var cellEl = this._mdlRowEl.cells[i];
		var min = cellEl.getBoundingClientRect().width;
		cellEl.className = "BSJSSortingAsc";
		min = Math.max(min, cellEl.getBoundingClientRect().width);
		cellEl.className = "BSJSSortingDesc";
		min = Math.max(min, cellEl.getBoundingClientRect().width);
		cellEl.className = "";
		this._colMinWidths[i] = min;
	}

	this._resizeContext = null;
	this._justResized = false;

	var self = this;
	window.addEventListener("resize",
		function(event) { self._onResize(event); });
	this._scrEl.addEventListener("scroll",
		function(event) { self._onScroll(event); });
	this._tblEl.tHead.addEventListener("mousemove",
		function(event) { self._onHeaderMouseMove(event); });
	this._tblEl.tHead.addEventListener("mousedown",
		function(event) { self._onHeaderMouseDown(event); });
	window.addEventListener("mousemove",
		function(event) { self._onWindowMouseMove(event); }, true);
	window.addEventListener("mouseup",
		function(event) { self._onWindowMouseUp(event); }, true);
	var fClick = function(event) { self._onHeaderClick(event); };
	for (var i = 0; i <= this._lastColInd; i++)
		this._hdrRowEl.cells[i].addEventListener("click", fClick);
}

BSJSTable.prototype.show = function() {

	this._setLayout();
	this._load();
};

BSJSTable.prototype._setLayout = function() {

	this._mdlEl.style.width = String(this._width) + "%";
	for (var i = 0; i < this._lastColInd; i++) {
		this._mdlRowEl.cells[i].style.width =
			String(this._columns[i].width) + "%";
	}

	this._updateLayout();

	this._tblEl.style.tableLayout = "fixed";
};

BSJSTable.prototype._updateLayout = function() {

	var mdlBR = this._mdlEl.getBoundingClientRect();

	this._topEl.style.paddingTop =
		String(mdlBR.height) + "px";

	this._tblEl.tHead.style.width =
	this._tblEl.style.width =
		String(mdlBR.width) + "px";

	for (var i = 0; i < this._lastColInd; i++) {
		this._hdrRowEl.cells[i].style.width =
		this._colGrpEl.children[i].style.width =
			String(this._mdlRowEl.cells[i].getBoundingClientRect().width) +
			"px";
	}
};

BSJSTable.prototype._adjustLayoutForScroller = function() {

	var scrollerWidth =
		this._scrEl.offsetWidth - this._scrEl.clientWidth;
	if (scrollerWidth > 0) {
		this._tblEl.style.width =
			String(this._mdlEl.getBoundingClientRect().width - scrollerWidth) +
			"px";
	}
};

/*BSJSTable.prototype._updateLayoutO = function() {

	this._topEl.style.paddingTop =
		String(this._mdlEl.tHead.offsetHeight) + "px";

	this._tblEl.tHead.style.width =
	this._tblEl.style.width =
		String(this._mdlEl.offsetWidth) + "px";

	for (var i = 0; i < this._lastColInd; i++) {
		this._hdrRowEl.cells[i].style.width =
		this._colGrpEl.children[i].style.width =
			String(this._mdlRowEl.cells[i].offsetWidth) + "px";
	}
};*/

/*BSJSTable.prototype._adjustLayoutForScrollerO = function() {

	var scrollerWidth =
		this._scrEl.offsetWidth - this._scrEl.clientWidth;
	if (scrollerWidth > 0) {
		this._tblEl.style.width =
			String(this._mdlEl.offsetWidth - scrollerWidth) + "px";
	}

	if (!this._empty) {
		var cntRowEl = this._tblEl.tBodies[0].rows[0];
		for (var i = 0; i < this._lastColInd; i++) {
			var hr = this._hdrRowEl.cells[i].getBoundingClientRect();
			var cr = cntRowEl.cells[i].getBoundingClientRect();
			var diff = hr.width - cr.width;
			if (diff != 0) {
				this._colGrpEl.children[i].style.width =
					String(cntRowEl.cells[i].offsetWidth + diff) + "px";
			}
		}
	}
};*/

BSJSTable.prototype._onScroll = function(event) {

	var hdrEl = this._tblEl.tHead;
	var scrEl = event.target;
	if (-hdrEl.offsetLeft != scrEl.scrollLeft)
		hdrEl.style.left = "-" + String(scrEl.scrollLeft) + "px";
};

BSJSTable.prototype._onResize = function(event) {

	this._updateLayout();
	this._adjustLayoutForScroller();
};

BSJSTable.prototype._onHeaderMouseMove = function(event) {

	if (this._resizeContext != null)
		return;

	var newStyle = "";
	this._ifInColumnResizeArea(event, function(cellEl) {
		newStyle = "col-resize";
	});
	var hdrStyle = this._tblEl.tHead.style;
	if (hdrStyle.cursor != newStyle)
		hdrStyle.cursor = newStyle;
};

BSJSTable.prototype._onHeaderMouseDown = function(event) {

	if (event.button != 0)
		return;

	this._ifInColumnResizeArea(event, function(cellEl) {

		event.stopImmediatePropagation();
		event.preventDefault();

		var ctx = {
				colIndex: cellEl.cellIndex,
				initX: event.clientX,
				lastDelta: 0,
				scrWidth: this._scrEl.getBoundingClientRect().width,
				initTblWidth: this._mdlEl.getBoundingClientRect().width,
				tailWidthPct: 0,
				initColWidths: [],
				newColWidths: [],
				layoutTimer: null
		};
		for (var i = 0; i <= this._lastColInd; i++) {
			ctx.initColWidths[i] =
			ctx.newColWidths[i] =
				this._mdlRowEl.cells[i].getBoundingClientRect().width;
			if (i > ctx.colIndex)
				ctx.tailWidthPct += this._columns[i].width;
		}

		this._mdlEl.style.width =
			String(ctx.initTblWidth) + "px";
		for (var i = 0; i < this._lastColInd; i++)
			this._mdlRowEl.cells[i].style.width =
				String(ctx.initColWidths[i]) + "px";

		this._resizeContext = ctx;

		// TODO: FF, Chrome, (Safari?): cursor over other els with exp cursor
		document.documentElement.style.cursor = "col-resize";
	});
};

BSJSTable.prototype._onWindowMouseMove = function(event) {

	var ctx = this._resizeContext;
	if (ctx == null)
		return;

	event.stopImmediatePropagation();
	event.preventDefault();

	ctx.lastDelta = event.clientX - ctx.initX;

	var colInd = ctx.colIndex;
	var lastColInd = this._lastColInd;

	var propLogic = (
			(this._mdlEl.getBoundingClientRect().width <=
				this._scrEl.getBoundingClientRect().width)
			&& !event.shiftKey
			&& (colInd != lastColInd));

	if (propLogic) {

		var initColWidth = ctx.initColWidths[colInd];
		var newColWidth = Math.max(
				initColWidth + ctx.lastDelta,
				this._colMinWidths[colInd]);

		ctx.newColWidths[colInd] = newColWidth;

		var extra = (initColWidth - newColWidth) -
			(ctx.initTblWidth - this._mdlEl.getBoundingClientRect().width);
		for (var i = colInd + 1; i <= lastColInd; i++) {
			newColWidth = ctx.initColWidths[i] +
				(this._columns[i].width * extra) / ctx.tailWidthPct;
			var overflow = this._colMinWidths[i] - newColWidth;
			if (overflow > 0) {
				newColWidth = this._colMinWidths[i];
				for (var j = colInd + 1; j <= lastColInd; j++) {
					if (j == i)
						continue;
					var room = ctx.newColWidths[j] - this._colMinWidths[j];
					if (room <= 0)
						continue;
					if (overflow <= room) {
						ctx.newColWidths[j] -= overflow;
						overflow = 0;
						break;
					} else {
						ctx.newColWidths[j] = this._colMinWidths[j];
						overflow -= room;
					}
				}
				if (overflow > 0) {
					propLogic = false;
					break;
				}
			}
			ctx.newColWidths[i] = newColWidth;
		}
	}

	if (propLogic) {

		for (var i = colInd; i < lastColInd; i++)
			this._mdlRowEl.cells[i].style.width =
				String(ctx.newColWidths[i]) + "px";

		this._mdlEl.style.width =
			String(ctx.scrWidth) + "px";

	} else {

		var initColWidth = ctx.initColWidths[colInd];
		var minColWidth = Math.max(
				this._colMinWidths[colInd],
				initColWidth - (ctx.initTblWidth - ctx.scrWidth));
		var newColWidth = Math.max(
				initColWidth + ctx.lastDelta,
				minColWidth);
		var trueDelta = newColWidth - initColWidth;

		if (trueDelta > 0) {
			this._mdlEl.style.width =
				String(ctx.initTblWidth + trueDelta) + "px";
			this._mdlRowEl.cells[colInd].style.width =
				String(newColWidth) + "px";
		} else {
			this._mdlRowEl.cells[colInd].style.width =
				String(newColWidth) + "px";
			this._mdlEl.style.width =
				String(ctx.initTblWidth + trueDelta) + "px";
		}
		for (var i = colInd + 1; i < lastColInd; i++)
			this._mdlRowEl.cells[i].style.width =
				String(ctx.initColWidths[i]) + "px";
	}

	if (ctx.layoutTimer == null) {
		var self = this;
		ctx.layoutTimer = setTimeout(function() {
			self._resizeContext.layoutTimer = null;
			self._onResize(null);
		}, 25);
	}
};

BSJSTable.prototype._onWindowMouseUp = function(event) {

	var ctx = this._resizeContext;
	if (ctx == null)
		return;

	this._resizeContext = null;
	this._justResized = true;
	var self = this;
	setTimeout(function() { self._justResized = false; }, 500);

	// TODO: restore cursor accordingly
	document.documentElement.style.cursor = "auto";

	if (ctx.layoutTimer != null)
		clearTimeout(ctx.layoutTimer);

	if (ctx.lastDelta == 0) {

		for (var i = 0; i < this._lastColInd; i++) {
			this._mdlRowEl.cells[i].style.width =
				String(this._columns[i].width) + "%";
		}

		this._mdlEl.style.width =
			String(this._width) + "%";

	} else {

		var newTblWidth = this._mdlEl.getBoundingClientRect().width;
		var newTblWidthPct = (newTblWidth * 100) / ctx.scrWidth;
		var pxlPct = 100 / newTblWidth;
		var newColWidthsPct = [];
		for (var i = 0; i < this._lastColInd; i++) {
			this._columns[i].width =
				BSJS.pixelWidthToPercentWidth(this._mdlRowEl.cells[i], pxlPct);
		}
		// TODO: set last col width for tidiness

		this._width =
			BSJS.pixelWidthToPercentWidth(this._mdlEl, 100 / ctx.scrWidth);

		localStorage["BSJSTable_" + this._id + "_width"] =
			String(this._width);
		for (var i = 0; i <= this._lastColInd; i++) {
			var key = "BSJSTable_" + this._id + "_" +
				this._columns[i].id + "_width";
			localStorage[key] = String(this._columns[i].width);
		}
	}

	this._onResize(null);
};

BSJSTable.prototype._onHeaderClick = function(event) {

	if (this._justResized)
		return;

	var order = null;
	var colId;
	for (var el = event.target; el != null; el = el.parentNode) {

		if (el.className == "BSJSSortingAscSymbol")
			order = "asc";
		else if (el.className == "BSJSSortingDescSymbol")
			order = "desc";

		if (el.nodeName == "TH") {
			colId = this._columns[el.cellIndex].id;
			break;
		}
	}

	if (order == null)
		order = (this._sorting[colId] == "asc" ? "desc" : "asc");

	if (!event.ctrlKey)
		this._sorting = {};
	this._sorting[colId] = order;

	this._load();
};

BSJSTable.prototype._setData = function(resp) {

	this._sorting = {};
	var sortingStr = "";
	for (var k in resp.sorting) {
		this._sorting[k] = resp.sorting[k];
		if (sortingStr.length > 0)
			sortingStr += ",";
		sortingStr += k + ":" + resp.sorting[k];
	}
	localStorage["BSJSTable_" + this._id + "_sorting"] = sortingStr;

	for (var i = 0; i <= this._lastColInd; i++) {
		var newStyle = "";
		var v = this._sorting[this._columns[i].id];
		if (v == "asc")
			newStyle = "BSJSSortingAsc";
		else if (v == "desc")
			newStyle = "BSJSSortingDesc";
		this._mdlRowEl.cells[i].className =
		this._hdrRowEl.cells[i].className = newStyle;
	}
	this._updateLayout();

	var tbodyEl = this._tblEl.tBodies[0];

	var wasEmpty = this._empty;

	var numRows = resp.data.length;
	this._empty = (numRows == 0);

	if (this._empty) {
		for (var i = tbodyEl.rows.length - 1; i >= 0; i--)
			tbodyEl.deleteRow(i);
		this._makeEmpty();
	} else {
		if (wasEmpty) {
			for (var i = tbodyEl.rows.length - 1; i >= 0; i--)
				tbodyEl.deleteRow(i);
		}
		for (var i = 0; i < numRows; i++) {
			var dataRow = resp.data[i];
			if (i >= tbodyEl.rows.length) {
				var rowEl = tbodyEl.insertRow(-1);
				for (var j = 0; j < this._columns.length; j++) {
					var cellEl = rowEl.insertCell(-1);
					var divEl = document.createElement("DIV");
					var colDesc = this._columns[j];
					divEl.innerHTML = colDesc.format(dataRow[colDesc.id]);
					cellEl.appendChild(divEl);
				}
			} else {
				var rowEl = tbodyEl.rows[i];
				for (var j = 0; j < this._columns.length; j++) {
					var cellEl = rowEl.cells[j];
					var colDesc = this._columns[j];
					cellEl.firstElementChild.innerHTML =
						colDesc.format(dataRow[colDesc.id]);
				}
			}
		}
		for (var i = tbodyEl.rows.length - 1; i >= numRows; i--)
			tbodyEl.deleteRow(i);
	}
};

BSJSTable.prototype._load = function() {

	this._showLoading();

	var self = this;

	var req = new XMLHttpRequest();
	req.onreadystatechange = function() {
		if (this.readyState == this.DONE) {
			if (this.status == 200) {
				self._setData(JSON.parse(this.responseText));
				self._adjustLayoutForScroller();
			} else {
				// TODO: process error
			}
		}
		self._hideLoading();
	};
	var params = "";
	for (var k in this._sorting) {
		if (params.length > 0)
			params += ",";
		else
			params += "?s=";
		params += k + ":" + this._sorting[k];
	}
	req.open("GET", this._dataUrl + params);
	req.send();
};

BSJSTable.prototype._showLoading = function() {

	this._ldrEl.style.visibility = "hidden";
	this._ldrEl.style.display = "block";
	this._ldrEl.style.top = String(this._tblEl.tHead.offsetHeight) + "px";
	this._ldrEl.style.height = String(this._scrEl.offsetHeight) + "px";
	var self = this;
	setTimeout(function() {
		self._ldrEl.style.visibility = "visible";
	}, 200);
};

BSJSTable.prototype._hideLoading = function() {

	this._ldrEl.style.display = "none";
};

BSJSTable.prototype._makeEmpty = function() {

	var tbodyEl = this._tblEl.tBodies[0];

	for (var i = tbodyEl.rows.length - 1; i >= 0; i--)
		tbodyEl.deleteRow(i);

	var rowEl = this._tblEl.tBodies[0].insertRow(-1);
	rowEl.className = "BSJSEmpty";
	var cellEl = document.createElement("TD");
	cellEl.colSpan = this._columns.length;
	var divEl = document.createElement("DIV");
	divEl.innerHTML = this._resources["message.noData"];
	cellEl.appendChild(divEl);
	rowEl.appendChild(cellEl);
};

BSJSTable.prototype._ifInColumnResizeArea = function(mouseEvent, callback) {

	var tblX = mouseEvent.clientX;
	for (var el = this._tblEl.tHead; el !== null; el = el.offsetParent)
		tblX -= el.offsetLeft + el.clientLeft - el.scrollLeft;

	var cellEl = mouseEvent.target;
	while (cellEl !== this._tblEl.tHead) {
		if (cellEl.nodeName == "TH")
			break;
		cellEl = cellEl.parentNode;
	}
	if (cellEl === this._tblEl.tHead) {
		for (var i = this._hdrRowEl.cells.length - 1; i >= 0; i--) {
			cellEl = this._hdrRowEl.cells[i];
			if (cellEl.offsetLeft <= tblX)
				break;
		}
	}

	var x = tblX;
	for (var el = cellEl; el !== this._tblEl.tHead; el = el.offsetParent)
		x -= el.offsetLeft - el.scrollLeft + el.clientLeft;
	if (x < 2 && cellEl.cellIndex != 0)
		callback.call(this, cellEl.previousElementSibling);
	else if (x > cellEl.clientWidth - 2)
		callback.call(this, cellEl);
};
