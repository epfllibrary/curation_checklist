// ==UserScript==
// @name        Zenodo Curation Checklist
// @require     https://cdn.jsdelivr.net/npm/jquery@3/dist/jquery.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/record/*
// @include     https://sandbox.zenodo.org/record/*
// @grant       none
// @version     1
// ==/UserScript==

this.$ = this.jQuery = jQuery.noConflict(true);
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

}


function openMailEditor(url) {
  location.href = url;
}

// wait for async elements to load
//setTimeout(addButton, 1000);

