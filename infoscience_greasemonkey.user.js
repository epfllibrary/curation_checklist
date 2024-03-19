// ==UserScript==
// @name        Infoscience lab contacts
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.infoscience
// @author      Alain Borel
// @include     https://infoscience.epfl.ch/record/*
// @grant       none
// @version     1.0
// ==/UserScript==

let getUrl = window.location;
let baseUrl = getUrl.protocol + "//" + getUrl.host + "/" + getUrl.pathname.split('/')[1] + "/" + getUrl.pathname.split('/')[2];;

let metadataUrl = baseUrl + '/export/xm';

alert(metadataUrl);


fetch(metadataUrl)
  .then(response => response.text())
  .then(data => {
    const xml = new DOMParser().parseFromString(data, "application/xml");
    //console.log(xml.innerHTML);
    for (let field of xml.getElementsByTagName('datafield')) {
      if (field.getAttribute('tag') == '999') {
        for (let subfield of field.getElementsByTagName('subfield')) {
          if (subfield.getAttribute('code') == 'm') {
            alert(subfield.innerHTML);
          }
        }
        
      }
    }
    // TODO find 999C0p
  })
  .catch(console.error);