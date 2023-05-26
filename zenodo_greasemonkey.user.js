// ==UserScript==
// @name        Zenodo Curation Checklist
// @resource    jqueryUiCss https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/record/*
// @include     https://sandbox.zenodo.org/record/*
// @grant       none
// @version     1
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);
$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css') );


addButtons();


function addButtons() {
  
  var btn = document.createElement('BUTTON');
  var t = document.createTextNode('Prepare curation e-mail');
  var frm = document.createElement('FORM');
  var icn = document.createElement('I');


  icn.setAttribute('class', "fa fa-external-link");
  btn.setAttribute('class', "btn btn-primary btn-block");
  btn.appendChild(icn);
  btn.appendChild(t);
  frm.appendChild(btn);
  
  frm.addEventListener("click", function(event) {
    
    var collapse = document.getElementById('collapseTwo');
    
    var zenodoURL = window.location.href;
    var finalURL = "mailto:info@zenodo.org";

    openMailEditor(finalURL);
    event.preventDefault();
  });

  var menu = document.getElementsByClassName("col-sm-4 col-md-4 col-right")[0];
  var metadata = document.getElementsByClassName("well metadata")[0];

  //menu.appendChild(btn);

  menu.insertBefore(frm, metadata);
  
  
  let relativeIdentifiers = $( "dt:contains('Related identifiers:')" );
  if (relativeIdentifiers) {
    relativeIdentifiers.attr("title", "are relative IDs OK?");
    relativeIdentifiers.tooltip();
    relativeIdentifiers.append('&nbsp;<input type="checkbox" name="recommended" value="R3"/>');
  }
  
  let grants = $( "dt:contains('Grants:')" );
  if (grants) {
    grants.append('&nbsp;<input type="checkbox" name="nth" value="N1" />');
  }
  
  let license = $( "dt:contains('License (for files):')" );
  if (license) {
    license.append('&nbsp;<input type="checkbox" name="nth" value="N3" />');
  }
  
  let keywords = $( "dt:contains('Keyword(s):')" );
  if (keywords) {
    keywords.append('&nbsp;<input type="checkbox" name="nth" value="N8" />');
  }
  

}


function openMailEditor(url) {
  location.href = url;
}

// wait for async elements to load
//setTimeout(addButton, 1000);
