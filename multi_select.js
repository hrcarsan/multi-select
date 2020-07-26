/**
 * MultiSelect.js
 *
 * Transmform a native select into a scrollable list of options that
 * be selected and filtered with a search input
 *
 * Usage:
 *
 * MultiSelect.create('some_select_id', {
 *  width: '100px'
 * });
 *
 * Note: compatible with ie8+
 *
 * @author Santiago Herrera C <hrcarsan@gmail.com>
 */

/**
 * @param {String} id
 * @param {Array} options
 */
MultiSelect.create = function (id, options)
{
  var select      = document.getElementById(id);
  var multiSelect = new MultiSelect(select, options);

  multiSelect.init();

  return multiSelect;
}

MultiSelect.opened = null;

if (document.addEventListener)
{
  document.addEventListener("click", function (e) { MultiSelect.onUserclick(e); }, false);
}
else // for ie
{
  document.attachEvent("onclick", function () { MultiSelect.onUserclick(); });
}

MultiSelect.onUserclick = function (e)
{
  if (!MultiSelect.opened)
  {
    return;
  }

  var event  = e || window.event;
  var target = event.target || event.srcElement;

  // check if the click was inside over the multi select
  while (target)
  {
    if (target.isMultiSelect)
    {
      return;
    }

    target = target.parentNode;
  }

  // if was outside close opened multi select
  MultiSelect.opened.close();
}

/**
 * MultiSelect class
 *
 * @param {Node} select
 * @param {Array} options
 */
function MultiSelect(select, options)
{
  this.select  = select;
  this.options = options || {};
}

MultiSelect.prototype.select           = null;
MultiSelect.prototype.options          = null;
MultiSelect.prototype.container        = null;
MultiSelect.prototype.filter           = null;
MultiSelect.prototype.results          = null;
MultiSelect.prototype.resultsContainer = null;
MultiSelect.prototype.filterTimeout    = null;

MultiSelect.prototype.init = function ()
{
  // a select is mandatory
  if (!this.select)
  {
    return;
  }

  // hide select input
  this.select.style.display = 'none';

  // create main container and add it after the select
  this.container = document.createElement("div");
  this.container.className = "multi_select";
  this.container.isMultiSelect = true;
  this.container.style.width = this.options.width || "200px";
  this.select.parentNode.insertBefore(this.container, this.select.nextSibling);

  // render child containers
  this.renderLinkContainer();
  this.renderSelectorContainer();
}

MultiSelect.prototype.renderLinkContainer = function ()
{
  $this = this;

  var linkContainer = document.createElement("div");
  linkContainer.className = "link_container";
  this.container.appendChild(linkContainer);

  if (this.options.label)
  {
    var label = document.createElement("b");
    label.innerHTML = this.options.label+": ";
    linkContainer.appendChild(label);
  }

  this.link = document.createElement("span");
  this.link.className = "select_link";
  this.link.onclick = function () { $this.open(); };
  linkContainer.appendChild(this.link);

  this.updateLink();
}

MultiSelect.prototype.updateLink = function ()
{
  var texts = this.getTexts();

  if (this.options.showSelectedFit)
  {
    this.link.innerHTML = texts.length?texts.join(','):'Select';
  }
  else
  {
    this.link.innerHTML = texts.length? texts[0]+(texts[1]? "...": ""): 'Select';
  }
}

MultiSelect.prototype.open = function ()
{
  $this = this;

  setTimeout(function ()
  {
    $this.selectorContainer.style.display = 'block';
    MultiSelect.opened = $this;
  })

  setTimeout(function () { $this.filter.focus() }, 50);
  this.adjustHeight();
}

MultiSelect.prototype.close = function ()
{
  this.selectorContainer.style.display = '';
  this.filter.value = "";
  this.onFilterChange();
  this.updateLink();
  MultiSelect.opened = null;
}

MultiSelect.prototype.renderSelectorContainer = function ()
{
  $this = this;

  this.selectorContainer = document.createElement("div");
  this.selectorContainer.className = "selector_container";
  this.container.appendChild(this.selectorContainer);

  this.filter = document.createElement("input");
  this.filter.type = "text";
  this.filter.className = "search";
  this.filter.onkeyup = function() { $this.onFilterChange(); };

  if (this.options.filterFocusClass)
  {
    this.filter.onfocus = function()
    {
      this.className += ' '+$this.options.filterFocusClass;
    };

    this.filter.onblur = function()
    {
      this.className = this.className.replace($this.options.filterFocusClass, "");
    };
  }

  this.selectorContainer.appendChild(this.filter);

  this.resultsContainer = document.createElement("div");
  this.resultsContainer.className = "results_container";
  this.resultsContainer.style.height = "200px";
  this.selectorContainer.appendChild(this.resultsContainer);

  this.renderResults();
}

MultiSelect.prototype.onFilterChange = function ()
{
  $this = this;

  clearTimeout(this.filterTimeout);

  this.filterTimeout = setTimeout(function ()
  {
    $this.filterOptions();
  }, 300);
}

MultiSelect.prototype.renderResults = function ()
{
  this.results = document.createElement("table");
  this.results.className = "results";
  this.resultsContainer.innerHTML = "";
  this.resultsContainer.appendChild(this.results);

  // row none found
  var row = this.results.insertRow(-1);
  row.style.display = 'none';

  var cell1 = row.insertCell(0);
  cell1.innerHTML = 'None found';
  cell1.className = 'text-col';
  cell1.colSpan   = 2;

  for (var i = 0; i < this.select.length; i++)
  {
    var option = this.select.options[i];
    var row    = this.results.insertRow(-1);

    row.onclick = function (e)
    {
      var event  = e || window.event;
      var target = event.target || event.srcElement;

      if (target == this.checkbox) return;

      this.checkbox.checked = !this.checkbox.checked;
      this.checkbox.onchange();
    }

    row.onmouseover = function ()
    {
      this.style.background = "#EEEEEE";
    }

    row.onmouseleave = function ()
    {
      this.style.background = "";
    }

    // left column
    var cell1 = row.insertCell(0);
    cell1.className = 'text-col';
    cell1.innerHTML = option.text;

    // right column
    var cell2 = row.insertCell(1);
    cell2.className = 'check-col';

    var checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = option.selected;
    checkbox.option = option;
    checkbox.onchange = function() { this.option.selected = this.checked; };
    row.checkbox = checkbox;
    cell2.appendChild(checkbox);
  }
}

MultiSelect.prototype.filterOptions = function ()
{
  if (this.filter.value)
  {
    var filterRegex = new RegExp(this.filter.value, 'i');
  }

  var noneFound = true;

  for (var i = 1; i < this.results.rows.length; i++)
  {
    var row = this.results.rows[i];

    if (this.filter.value && !filterRegex.test(row.cells[0].innerHTML))
    {
      row.style.display = 'none';
    }
    else
    {
      row.style.display = '';
      noneFound = false;
    }
  }

  this.results.rows[0].style.display = noneFound? '': 'none';

  this.adjustHeight();
}

MultiSelect.prototype.adjustHeight = function ()
{
  $this = this;

  setTimeout(function ()
  {
    var height = Math.min($this.results.offsetHeight+2, 200);

    $this.resultsContainer.style.height = height+"px";
  }, 30);
}

MultiSelect.prototype.getValues = function ()
{
  var values = [];

  for (var i = 0; i < this.select.length; i++)
  {
    var option = this.select.options[i];

    if (option.selected)
    {
      values.push(option.value);
    }
  }

  return values;
}

MultiSelect.prototype.getTexts = function ()
{
  var texts = [];

  for (var i = 0; i < this.select.length; i++)
  {
    var option = this.select.options[i];

    if (option.selected)
    {
      texts.push(option.text);
    }
  }

  return texts;
}
