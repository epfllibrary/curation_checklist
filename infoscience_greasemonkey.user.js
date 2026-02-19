// ==UserScript==
// @name        Infoscience datasets curation
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.infoscience
// @author      Alain Borel
// @include     https://infoscience.epfl.ch/entities/product/*
// @grant       none
// @version     1.0
// ==/UserScript==


// https://infoscience.epfl.ch/server/api/core/items/a0c90826-53bb-4cb9-bde8-02aa6933fdc9?embed=owningCollection%2FparentCommunity%2FparentCommunity&embed=relationships&embed=version%2Fversionhistory&embed=bundles%2Fbitstreams&embed=thumbnail&embed=metrics

console.log("infoscience_greasemonkey here");

let getUrl = window.location;
let baseUrl = getUrl.protocol + '//' + getUrl.host + '/server/api/core/items/' + getUrl.pathname.split('/')[3];
console.log(baseUrl);
let metadataUrl = baseUrl + '/?embed=owningCollection%2FparentCommunity%2FparentCommunity&embed=relationships&embed=version%2Fversionhistory&embed=bundles%2Fbitstreams&embed=thumbnail&embed=metrics';

let actionMenu = $('div#actions');



fetch(metadataUrl)
  .then(response => response.text())
  .then(data => {
    const jsonRecord = JSON.parse(data);
    console.log(jsonRecord.metadata["dc.title"][0].value);
    })
  .catch(console.error);