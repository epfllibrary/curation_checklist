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

const checklistData = {
  "M1": "At least one author must be affiliated with EPFL at the time of the submission or creation of the submitted work",                
  "M2": "The content of the dataset must be accessible for review, i.e. Open Access, or Restricted after an access request has been completed. Embargoed datasets will be reviewed after the embargo has expired",
  "M3": "The Description of the submitted dataset must be  sufficiently detailed. Mere references to external articles or other resources are not a sufficient description",
  "M4": "If no ORCID is listed, the name and surname and EPFL email address of at least one author must be specified in the Description",
  "R1": "Authors are identified by their ORCID",
  "R2": "The title should be human-readable on the same level as conventional publications: filenames or coded expressions are deprecated",
  "R3": 'If existing, references to related publications (e.g., article, source code, other datasets, etc.) should specified in the "Related/alternate identifiers" field, using a DOI if available',
  "R4": "In general, a README file should be present in the root directory, and in case the submission consists of a compressed file then it is external. The README file is not needed for records consisting in one single document which already contains enough information (such as publications, posters and presentation slides)",  
  "R5": "Any sensitive, personal data should have been anonymized",
  "N1": 'If applicable, related grants should acknowledged using “Funding/Grants” fields"',
  "N2": "Dataset should have been cleaned up (e.g., there are no temporary or unnecessary empty files or folders, no superfluous file versions, etc.)",
  "N3": "Permissive licenses are preferred (order of preference: CC0, CC-BY-4.0, CC-BY-SA-4.0 for data; MIT, BSD, GPL for code)",
  "N4": "When a README file is advised, it could contain information such as the convention for files and folders naming, possible ontologies or controlled vocabularies, etc.",
  "N5": "If the submission is related to a PhD thesis, the supervisor should be specified",
  "N6": "Files should be available in open formats",
  "N7": "Where applicable, sources from which the work is derived should be specified",
  "N8": "Keywords should be entered as separated fields"
};


const checklistStyle = `
<style>
.check {
  -webkit-appearance: none; /*hides the default checkbox*/
  height: 20px;
  width: 20px;
  transition: 0.10s;
  background-color: #FE0006;
  text-align: center;
  font-weight: 600;
  color: white;
  border-radius: 3px;
  outline: none;
}

.check:checked {
  background-color: #0E9700;
}

.check:before {
  content: "✖";
}
.check:checked:before {
  content: "✔";
}

.check:hover {
  cursor: pointer; 
  opacity: 0.8;
}
</style>
`;

this.$ = this.jQuery = jQuery.noConflict(true);
$('head').append( $('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css') );
$('head').append( checklistStyle );


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
    relativeIdentifiers.attr("title", checklistData["R3"]);
    relativeIdentifiers.tooltip();
    relativeIdentifiers.append('&nbsp;<input type="checkbox" name="recommended" value="R3"/>');
  }
  
  let grants = $( "dt:contains('Grants:')" );
  if (grants) {
    grants.attr("title", checklistData["N1"]);
    grants.tooltip();
    grants.append('&nbsp;<input type="checkbox" class="check" name="nth" value="N1" />');
  }
  
  let license = $( "dt:contains('License (for files):')" );
  if (license) {
    license.append('&nbsp;<input type="checkbox" class="check" name="nth" value="N3" />');
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
