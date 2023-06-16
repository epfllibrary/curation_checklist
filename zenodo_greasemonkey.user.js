// ==UserScript==
// @name        Zenodo Curation Checklist
// @resource    jqueryUiCss https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/record/*
// @include     https://sandbox.zenodo.org/record/*
// @grant       none
// @version     1.1
// ==/UserScript==

// TODO use https://stackoverflow.com/questions/18231259/how-to-take-screen-shot-of-current-webpage-using-javascript-jquery

const checklistData = {
  "M1": {"full": "At least one author must be affiliated with EPFL at the time of the submission or creation of the submitted work",
         "short": "<b>&nbsp;EPFL authors?</b>",
         "category": "must",
         "wrapper": "span"},                
  "M2": {"full": "The content of the dataset must be accessible for review, i.e. Open Access, or Restricted after an access request has been completed. Embargoed datasets will be reviewed after the embargo has expired",
         "category": "must",
         "short": "<b>Access to content?</b>",
         "wrapper": "span"},   
  "M3": {"full": "The Description of the submitted dataset must be  sufficiently detailed. Mere references to external articles or other resources are not a sufficient description",
         "category": "must",
         "short": "<b>Sufficient abstract?</b>",
         "wrapper": "div"},
  "M4": {"full": "If no ORCID is listed, the name and surname and EPFL email address of at least one author must be specified in the Description",
         "category": "must",
         "short": "<b>&nbsp;Email or ORCID for 1 author?</b>",
         "wrapper": "span"},   
  "R1": {"full": "Authors are identified by their ORCID",
         "category": "recommended",
         "short": "<b>&nbsp;Authors with ORCID?</b>",
         "wrapper": "span"},   
  "R2": {"full": "The title should be human-readable on the same level as conventional publications: filenames or coded expressions are deprecated",
         "category": "recommended",
         "short": "&nbsp;",
         "wrapper": "span"},   
  "R3": {"full": 'If existing, references to related publications (e.g., article, source code, other datasets, etc.) should specified in the "Related/alternate identifiers" field, using a DOI if available',
         "category": "recommended",
         "short": "&nbsp;",
         "wrapper": "span",
         "altspan": "dt",
         "altshort": "<b>No related identifiers here, is it OK?&nbsp;</b>"},   
  "R4": {"full": "In general, a README file should be present in the root directory, and in case the submission consists of a compressed file then it is external. The README file is not needed for records consisting in one single document which already contains enough information (such as publications, posters and presentation slides)",
         "category": "recommended",
         "short": "&nbsp;<b>README present?</b>",
         "wrapper": "span"},    
  "R5": {"full": "Any sensitive, personal data should have been anonymized",
         "category": "recommended",
         "short": "&nbsp;<b>No sensitive data?</b>",
         "wrapper": "span"},   
  "N1": {"full": 'If applicable, related grants should acknowledged using “Funding/Grants” fields',
         "category": "nth",
         "short":"TBD",
         "wrapper": "dt",
         "selector": "dt:contains('Grants:')"},   
  "N2": {"full": "Dataset should have been cleaned up (e.g., there are no temporary or unnecessary empty files or folders, no superfluous file versions, etc.)",
         "category": "nth",
         "short": "<b>&nbsp;Clean content?</b> ",
         "wrapper": "span"},
  "N3": {"full": "Permissive licenses are preferred (order of preference: CC0, CC-BY-4.0, CC-BY-SA-4.0 for data; MIT, BSD, GPL for code)",
         "category": "nth",
         "short": "&nbsp;",
         "wrapper": "span",
         "altshort": "<b>No license, probably wrong&nbsp;</b>",
         "altwrapper": "dt"},
  "N4": {"full": "When a README file is advised, it could contain information such as the convention for files and folders naming, possible ontologies or controlled vocabularies, etc.",
         "category": "nth",
         "short": "<b>&nbsp;Good README?</b> ",
         "wrapper": "span"},
  "N5": {"full": "If the submission is related to a PhD thesis, the supervisor should be specified",
         "category": "nth",
         "short": "TBD",
         "wrapper": "dt"},
  "N6": {"full": "Files should be available in open formats",
         "category": "nth",
         "short": "<b>&nbsp;Open file formats?</b> ",
         "wrapper": "span"},
  "N7": {"full": "Where applicable, sources from which the work is derived should be specified",
         "category": "nth",
         "short": "TBD",
         "wrapper": "span"},
  "N8": {"full": "Keywords should be entered as separated fields",
         "category": "nth",
         "short": "TBD",
         "wrapper": "dt"}
};


const checklistStyle = `
<style>
.check {
  -webkit-appearance: none; /*hides the default checkbox*/
  height: 2ch;
  width: 2ch;
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


function addCheckElement(selector, checkCode, position, normal) {
  let checkElement;
  if (normal) {
    checkElement = $(`<${checklistData[checkCode].wrapper}>${checklistData[checkCode].short}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].wrapper}>`);
  } else {
    checkElement = $(`<${checklistData[checkCode].altwrapper}>${checklistData[checkCode].altshort}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].altwrapper}>`);    
  }
  checkElement.attr("title", checklistData[checkCode].full);
  checkElement.tooltip();
  if (position == "before") {
    selector.prepend(checkElement);
  } else {
    selector.append(checkElement);
  }
}


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
    let title = $('h1').text();
    console.log(title);
    console.log(zenodoURL);
    
    let emailTo = 'info@zenodo.org';
    let emailSub = 'Zenodo dataset submitted to the EPFL community';
    
    var text = '';
    event.preventDefault();
    const MustCheckboxUnchecked = $('input[name="must"]:not(:checked)').tsort({attr:'value'});
    const RecommendedCheckboxUnchecked = $('input[name="recommended"]:not(:checked)').tsort({attr:'value'});
    const NTHCheckboxUnchecked = $('input[name="nth"]:not(:checked)').tsort({attr:'value'});
    
    
    if (MustCheckboxUnchecked.length) {
      text += `Total ${MustCheckboxUnchecked.length} missing MUST criteria:\n`;
      
      MustCheckboxUnchecked.each(function () {
        let value = $(this).val();
        text += `${value}: `;
        text += `${checklistData[value].full}\n`; 
        text += `=>\n\n`;
      })
      
    }

    
    if (RecommendedCheckboxUnchecked.length) {
      text += `Total ${RecommendedCheckboxUnchecked.length} missing RECOMMENDED criteria:\n`;
      RecommendedCheckboxUnchecked.each(function () {
        let value = $(this).val();
        text += `${value}: `;
        text += `${checklistData[value].full}\n`; 
        text += `=>\n\n`;
      })
    }

    
    if (NTHCheckboxUnchecked.length) {
      text += `Total ${NTHCheckboxUnchecked.length} missing NICE TO HAVE criteria:\n`;
      NTHCheckboxUnchecked.each(function () {
        let value = $(this).val();
        text += `${value}: `;
        text += `${checklistData[value].full}\n`; 
        text += `=>\n\n`;
      })
    }

    console.log('variable URL at the end');
    // TODO adapt or replace entirely DOI detection
    let doi = $('input[name="DOI"]').val();
    if (doi === '') {
      doi = 'dummy';
    }
    console.log('https://api.datacite.org/dois/' + doi);
    fetch('https://api.datacite.org/dois/' + doi, {
      method: 'GET', 
      headers: {
        accept: 'application/json'
      }
    })
    .then(resp => resp.json())
    .then(json => {
      console.log(json);
      let identifier = 'XXXXXX';
      if ('data' in json) {
        console.log('And we have a winner!');
        // TODO check if only valid for the meta-DOI and not for versions
        identifier = json.data.attributes.url;
        title = json.data.attributes.titles[0].title;
        console.log(identifier, title);
      }

      let header = ""
      let footer = ""
      if (text == "") {
        header += `Good XXX,\n\nYou are designated as EPFL creators for the dataset \"${title}\" (${identifier}), which has been submitted to the EPFL Community. It is my pleasure to report that the dataset meets all of our quality requirements and is now accepted in the collection.\n\n`;
        header += "As per our new workflow, the dataset will also be listed on Infoscience by our staff. The record will be submitted for approval to your laboratory, similar to the process followed by publications imported from the Web of Science.\n\n"
        header += "XXX CHECK IF APPLICABLE XXX "
        header += "Furthermore, considering that the dataset is linked to a publication, we will also archive a copy of the dataset for long-time preservation in EPFL's ACOUA platform (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info).\n"
        header += "\n\n"
        header += "If you have any question about these steps, do not hesitate to ask!"

        footer += "Best regards,\nZZZZZZ"
      } else {
        emailSub += encodeURIComponent(': '+title);
        header += `Good XXX,\n\nYou are designated as EPFL creators for the dataset \"${title}\" (${zenodoURL}), which has been submitted to the EPFL Community.\n\n`;
        header += "Within our new curation procedure ( https://zenodo.org/communities/epfl/about/ ), we have identified a few details that could be improved:\n\n";

        footer += "With this curation procedure, we introduce new processes intended to add value to your results and potentially save some of your time:\n";
        footer += "- we create Infoscience records for datasets newly accepted into the EPFL community, so that they are available for web pages, activity reports, etc.\n";
        footer += "- if the dataset is related with a publication and if the distribution license allows it, we can take advantage of this situation to copy the dataset into EPFL's long time archive ACOUA (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info) without any administrative burden for the authors.\n";
        footer += "\n\nIf you have any questions or comments about this service, do not hesitate to ask. We will be glad to answer or receive your feedback.\n\n"
        footer += "Best regards,\nZZZZZZ"
      }

      text = header + text + footer;
      let finalURL = "mailto:"+emailTo+'?&subject='+emailSub+'&body='+encodeURIComponent(text);
      console.log(finalURL);
      openMailEditor(finalURL);
    })
    .catch(err => console.error(err));

  }); 

  var menu = document.getElementsByClassName("col-sm-4 col-md-4 col-right")[0];
  var metadata = document.getElementsByClassName("well metadata")[0];

  //menu.appendChild(btn);

  menu.insertBefore(frm, metadata);
  
  let mainTitle = $("h1");
  let authorList = mainTitle.next('p');
  if (authorList.length) {
    addCheckElement(authorList, "M1", "after", true);
  }
  
  
  let contentChecks = $('<div>');
  let contentElement = $("div#preview");
  if (contentElement.length == 0) {
    contentElement = $("div#files");
  }
  if (contentElement.length) {
    addCheckElement(contentChecks, "M2", "after", true);
  }
  
  let abstract = $("div.record-description");
  if (abstract.length) {
    addCheckElement(abstract, "M3", "before", true);
  }
 
  if (authorList.length) {
    addCheckElement(authorList, "M4", "after", true);
    addCheckElement(authorList, "R1", "after");
    
    
  }
  
  if (contentElement.length) {
    addCheckElement(contentChecks, "R4", "after", true);
    addCheckElement(contentChecks, "R5", "after", true);
  }
  
  if (mainTitle.length) {
    addCheckElement(mainTitle, "R2", "after");
  }
  
  // This one should always be there, let's use it as a reference point
  
  let importantFrame = $( "dt:contains('Publication date:')" ).parent();
  
  let license = $( "dt:contains('License (for files):')" );
  if (license.length) {
    addCheckElement(license, "N3", "after", true);
  } else {
    addCheckElement(importantFrame, "N3", "after", false);
  }
  
  let relativeIdentifiers = $( "dt:contains('Related identifiers:')" );
  if (relativeIdentifiers.length) {
    addCheckElement(relativeIdentifiers, "R3", "after", true);
  } else {
    addCheckElement(importantFrame, "R3", "after", false);
  }
  
  let grants = $( "dt:contains('Grants:')" );
  if (grants.length) {
    grants.attr("title", checklistData["N1"].full);
    grants.tooltip();
    grants.append('&nbsp;<input type="checkbox" class="check" name="nth" value="N1" />');
  } else {
    grants = $('<dt>No grants here, is it OK? &nbsp;<input type="checkbox" name="nth" class="check" value="N1" /></dt>');
    grants.attr("title", checklistData["N1"].full);
    grants.tooltip();
    importantFrame.append(grants);
  }
  
  if (contentElement.length) {
    addCheckElement(contentChecks, "N2", "after", true);
    addCheckElement(contentChecks, "N4", "after", true);
  }
  
  let thesisUniversity = $( "dt:contains('Awarding University:')" );
  if (thesisUniversity.length) {
    thesisUniversity.attr("title", checklistData["N5"].full);
    thesisUniversity.tooltip();
    thesisUniversity.append('&nbsp;Supevisor listed?<input type="checkbox" class="check" name="nth" value="N5" />');
  } else {
    thesisUniversity = $('<dt>No thesis indication, probably OK&nbsp;<input type="checkbox" name="nth" class="check" value="N5" /></dt>');
    thesisUniversity.attr("title", checklistData["N5"].full);
    thesisUniversity.tooltip();
    importantFrame.append(thesisUniversity);
  }
  
  if (contentElement.length) {
    addCheckElement(contentChecks, "N6", "after", true);
  }
  
  let referencesElement = $("div#references");
  if (referencesElement.length) {
    let referencesCheck = $('<span><b>&nbsp;Relevant sources?</b> <input type="checkbox" class="check" name="nth" value="N7" /><span>');
    referencesCheck.attr("title", checklistData["N7"].full);
    referencesCheck.tooltip();
    referencesElement.append(referencesCheck);  
  } else {
    referencesElement = $("div#citation");
    let referencesCheck = $('<span><b>&nbsp;No "References" section, is this OK?</b> <input type="checkbox" class="check" name="nth" value="N7" /><span>');
    referencesCheck.attr("title", checklistData["N7"].full);
    referencesCheck.tooltip();
    referencesElement.prepend(referencesCheck);
  }
  
  let keywords = $( "dt:contains('Keyword(s):')" );
  console.log('Keywords', keywords);
  if (keywords.length) {
    let keywordCheck = $('<span>&nbsp;<input type="checkbox" class="check" name="nth" value="N8" /><span>');
    keywordCheck.attr("title", checklistData["N8"].full);
    keywordCheck.tooltip();
    keywords.append(keywordCheck);
  } else {
    let keywordCheck = $('<dt>No keywords here, is it OK? &nbsp;<input type="checkbox" name="nth" class="check" value="N8" /></dt>');
    keywordCheck.attr("title", checklistData["N8"].full);
    keywordCheck.tooltip();
    importantFrame.append(keywordCheck);
  }
  
  contentElement.prepend(contentChecks);

}


function openMailEditor(url) {
  location.href = url;
}

// wait for async elements to load
//setTimeout(addButton, 1000);
