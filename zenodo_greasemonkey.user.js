// ==UserScript==
// @name        Zenodo Curation Checklist
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.14.1/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/records/*
// @include     https://sandbox.zenodo.org/records/*
// @include     https://zenodo.org/communities/epfl/requests/*
// @include     https://zenodo.org/communities/eth-domain-oer-rdm/requests/*
// @include     https://sandbox.zenodo.org/communities/epfl/requests/*
// @include     https://sandbox.zenodo.org/communities/eth-domain-oer-rdm/requests/*
// @include     https://zenodo.org/me/requests/*
// @include     https://sandbox.zenodo.org/me/requests/*
// @exclude     https://sandbox.zenodo.org/records/*/export/*
// @exclude     https://sandbox.zenodo.org/records/*preview/*
// @exclude     https://zenodo.org/records/*/export/*
// @exclude     https://zenodo.org/records/*preview/*
// @downloadURL https://github.com/epfllibrary/curation_checklist/raw/refs/heads/main/zenodo_greasemonkey.user.js
// @grant       none
// @version     1.7
// ==/UserScript==

// TODO add standardized comments for non-compliant results where possible
// TODO: find further ideas to check criteria M3, R4 (if we find a comment about grant in the description), N1 (maybe a quick look at the files for the worst offenders: ._*, *.bak, ...), N6 (maybe lists based on the Fastguide)

/**
Check levels:
All possible importance levels, in short and long format
*/
const checkLevels = [{'short': 'must', 'full': 'MUST (mandatory for acceptance into the collection)'}, {'short': 'recommended', 'full': 'RECOMMENDED'}, {'short': 'nth', 'full': 'NICE-TO-HAVE'}];


/**
Checklist data:
each curation criterion is desribed by:
- main identifier M1, M2,... Mn, R1, R2... Rn, N1, N2...Nn according to the importance level and numbering
- full: the criterio as listed in the curation policy (to display as baloon help)
- short: HTML string that will be inserted next to the relevant checklist buttons
- answers: text used in the feedback message, depending on the selected checkbox button. bad = red x, meh = red ?, maybe = green ?, ok = green x, neutral otherwise
- category: importance level, using the short code from checkLevels
- wrapper: HTML tag that will contain the short text. span or div depending on what works best in the web page of interest.
For some criteria, mostly when they deal with optional fields (such as keywords), there can can be alternative values:
- altshort
- altwrapper
*/
const checklistData = {
  'M1': {
    'full': 'At least one author must be affiliated with EPFL at the time of the submission or creation of the submitted work',
    'short': '<b>EPFL authors?&nbsp;</b>',
    'answers': {
      'bad': 'There is not enough evidence that the authors are or were affiliated with EPFL, we would be grateful for more details (for example an e-mail address or ORCID identifier)',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'wrapper': 'div'
  },
  'M2': {
    'full': 'Contact information for at least one EPFL author is provided, preferably through an ORCID identifier',
    'answers': {
      'bad': 'Minimal contact information for an EPFL author must be available, please add it either using ORCID or in the Description.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<b>ORCID or email for 1 EPFL author?&nbsp;</b>',
    'wrapper': 'div'
  },
  'M3': {
    'full': 'The content of the submitted work must be accessible for review, i.e. Open Access, or Restricted after an access request has been granted to the reviewers. Embargoed works will be reviewed after the embargo expires',
    'answers': {
      'bad': 'If we cannot access the content of the dataset, we cannot check its compliance with our curation criteria. Would it be possible to make it at least Restricted?',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<b>Access to content?&nbsp;</b>',
    'wrapper': 'div'
  },
  'M4': {
    'full': 'The Description of the submitted work is sufficiently detailed. Mere references to external articles or to other external resources are not sufficient descriptions',
    'answers': {
      'bad': 'For example, a few sentences explaining how the files were generated or used would be very helpful for a potential user. If the data was used in a publication, you could also include part of the article abstract, to make the scientific context more immediately apparent.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<b>Sufficient abstract?&nbsp;</b>',
    'altshort': '<b>Sufficient abstract?&nbsp;</b>',
    'wrapper': 'div'
  },
  'M5': {
    'full': 'The submitted work includes a clearly identifiable README file, typically in the root directory. This is not required for works consisting in one single document (ex. publications, posters, or presentation slides)',
    'answers': {
      'bad': 'Such a file really facilitates a potential user\'s understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, it is a requirement for long-term archiving by EPFL\'s ACOUA system (further info at the end of this message).',
      'meh': 'Such a file really facilitates a potential user\'s understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, it is a requirement for long-term archiving by EPFL\'s ACOUA system (further info at the end of this message).',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<b>README present?&nbsp;</b>',
    'wrapper': 'span'
  },
  'M6': {
    'full': 'The main DOI has been assigned by Zenodo',
    'answers': {
      'bad': 'Entering an existing DOI as the main identifier is allowed only if the submitted work is an exact copy of a digital object that has already received its DOI on another platform, but even in that case an IsIdenticalTo relationship will be more correct. Typically, supplementary data to a journal article should NOT re-use the journal article DOI.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<b>&nbsp;Original (Zenodo) DOI?&nbsp;</b>',
    'wrapper': 'span'
  },
  'R1': {
    'full': 'All authors are identified by their ORCID',
    'answers': {
      'bad': 'By listing all authors with their respective ORCID, you make sure that they can be recognized unambiguously. If an EPFL author has no ORCID yet, we strongly suggest to create one: see https://actu.epfl.ch/news/link-your-orcid-profile-with-epfl/ for more info',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<b>Authors with ORCID?&nbsp;</b>',
    'wrapper': 'div'
  },
  'R2': {
    'full': 'The main title should be human-readable on the same level as conventional publications: filenames or coded expressions are deprecated',
    'answers': {
      'bad': 'As for any scientific output, a good title is the first place where others will learn about the nature and purpose of your research. The same principles as for scientific papers are applicable.',
      'meh': 'It is usually better to distinguish a dataset from the associated publication through their titles. A simple recipe could be "Dataset for " + the article title',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<b>&nbsp;</b>',
    'wrapper': 'span'
  },
  'R3': {
    'full': 'If existing, references to related publications (e.g., article, source code, other datasets, etc.) are specified in the "Related works" field. If available, references are designated by their respective DOIs',
    'answers': {
      'bad': 'The upload appears to be related with a publication. If the final publication or a version of the manuscript is available online, it should be listed it in the "Related/alternate identifiers" section - preferably using a DOI but a URL is fine if no DOI has been assigned to the publication. If no online version exists yet (even a preprint), can you give us an estimated time for the expected publication?',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<b>&nbsp</b>;',
    'wrapper': 'span',
    'altwrapper': 'dt',
    'altshort': '<b>No related identifiers here, is it OK?&nbsp;</b>'
  },
  'R4': {
    'full': 'If related grants require an acknowledgement, they are listed using “Funding/Grants” fields',
    'answers': {
      'bad': 'There are specific fields to list grants, it is better to use them than to write an acknowledgement in the description: it facilitates the automatic retrieval of that information on the funders\' platfoms',
      'meh': 'There is no mention of specific funding, which is fine if the project is operated using EPFL budget only. However, if some funding body (such as the Swiss National Science Foundation, some European program or other) is acknowledged in the publication it should be listed here as well.',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<b>&nbsp;</b>',
    'wrapper': 'span',
    'altshort': '<b>No grants here, is it OK?&nbsp;</b>',
    'altwrapper': 'dt',
    'selector': 'dt:contains("Grants:")'
  },
  'R5': {
    'full': 'Any sensitive, personal data has been anonymized',
    'answers': {
      'bad': 'The upload contains personal data about human research subjects, which is forbidden by various laws. Make sure the access is strictly limited and/or replace the data with an anonymized version',
      'meh': 'THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG',
      'maybe': 'THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<b>No sensitive data?&nbsp;</b>',
    'wrapper': 'div'
  },
  'N1': {
    'full': 'The submitted work has been cleaned up (e.g., there are no temporary files, no unnecessary empty files or folders, no superfluous file versions, etc.)',
    'answers': {
      'bad': '[ONE POSSIBLE CASE]This is just a suggestion at this point but is quite a frequent one for us: in the future, you might want to exclude .DS_Store and other similar MacOS files in your archives. The otherwise very convenient "Compress" command in the OSX Finder makes it difficult to avoid this, but there are other tools that you could use instead, see https://apple.stackexchange.com/questions/239578/compress-without-ds-store-and-macosx for a few possible options.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>Clean content?&nbsp;</b> ',
    'wrapper': 'div'
  },
  'N2': {
    'full': 'Permissive licenses are preferred. CC0, CC-BY-4.0, CC-BY-SA-4.0 for data and MIT, BSD, GPL for code are suggested',
    'answers': {
      'bad': 'Limited access and re-usability are against the principles of Open Science endorsed by EPFL. Are you sure you cannot use a more liberal license?',
      'meh': 'The chosen license limits the potential re-use of your data by others. There can be valid reasons for that, but in general we encourage the most open options',
      'maybe': 'An unusual license was chosen for this upload, is there a reason why it was preferred over the better-known options?',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>&nbsp;</b>',
    'wrapper': 'span',
    'altshort': '<b>No license, probably wrong&nbsp;</b>',
    'altwrapper': 'dt'
  },
  'N3': {
    'full': 'The README file contains detailed information about the work creation (authors, time, place, methodologies…), content (file organization and naming, formats, relevant standards…), sharing and access, etc.',
    'answers': {
      'bad': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/handle/20.500.14299/192546',
      'meh': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/handle/20.500.14299/192546',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>Good README?&nbsp;</b> ',
    'wrapper': 'div'
  },
  'N4': {
    'full': 'If the submission is related to a PhD thesis, the supervisor is specified',
    'answers': {
      'bad': 'There are mentions of a PhD thesis, this should be formally declared using the relevant input field with the supervisor name and institution',
      'meh': 'THIS IS NOT A GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'maybe': 'THIS IS NOT A GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>&nbsp;| Supervisor listed?&nbsp;</b>',
    'wrapper': 'span',
    'altshort': '<b>No thesis indication, probably fine&nbsp;</b>',
    'altwrapper': 'dt'
  },
  'N5': {
    'full': 'Files are available in open formats. If proprietary formats are present, the work also includes versions of the files converted to open formats, with the least possible loss of information',
    'answers': {
      'bad': 'A potential user is more likely to be able to work with your data if it is available in open formats, since they will less restricted by some specific software choice. You can check our Fast Guide for examples https://infoscience.epfl.ch/record/265349/files/04_Formats_EPFL_Library_RDM_FastGuide.pdf',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>Open file formats?&nbsp;</b> ',
    'wrapper': 'div'
  },
  'N6': {
    'full': 'Where applicable, sources from which the work is derived are specified in the "References" field',
    'answers': {
      'bad': 'It seems that the upload is derived from existing data. In such a case, the source of that data is best acknowledged using structured metadata: the "Related/alternate identifiers" section is generally intended for digitial sources, the "References" section can be used for other sources',
      'meh': 'THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'maybe': 'THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>&nbsp;Relevant sources?&nbsp;</b>',
    'wrapper': 'span',
    'altshort': '<b>No "References" section, is this OK?&nbsp;</b>',
    'altwrapper': 'span'
  },
  'N7': {
    'full': 'Keywords are entered as separated fields in the “Keywords and subjects" field',
    'answers': {
      'bad': 'To maximize the effectiveness of keywords, each concept must be listed a distinct entity: each entity will have its own link that leads to other records tagged with the same concept. This will not work if all keywords are combined as one single text entry.',
      'meh': 'No keywords are listed, you might consider adding some. It will make it easier for potential users to discover the dataset (through search results or links from other datasets with the same keywords), and then to understand its context',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<b>&nbsp;</b>',
    'wrapper': 'span',
    'altshort': '<b>No keywords here, is it OK?&nbsp;</b>',
    'altwrapper': 'dt'
  }
};

// Values of all checkbuttons if created with computed evaluation
const buttonValues = {
  'neutral': [' ', '?', ' '],
  'ok': [' ', ' ', 'x'],
  'maybe': [' ', ' ', '?'],
  'bad': ['x', ' ', ' '],
  'meh': ['?', ' ', ' ']
}


function state2checkValue(buttonID, value) {
  /**
   * Convert manually selected checkbutton states into an evaluation
   */
  if (buttonID == 'bad' && value == 'x') {
    return 'bad';
  }
  if (buttonID == 'bad' && value == '?') {
    return 'meh';
  }
  if (buttonID == 'ok' && value == '?') {
    return 'maybe';
  }
  if (buttonID == 'ok' && value == 'x') {
    return 'ok';
  }
  return 'neutral';
}

// CSS for the checkbuttons. Do not touch.
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

label.btn {
  height: 4ch;
  border: 1px solid gray
}

</style>
`;

// Script initialization. In particular, insert the necessary stylesheets
this.$ = this.jQuery = jQuery.noConflict(true);
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css'));
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css'));

$('head').append(checklistStyle);
console.log('greasemonkey_checklist active');


// Thanks to https://stackoverflow.com/questions/190253/how-to-use-a-regular-expression-in-a-jquery-selector
// useful helper to use regexps in JQuery selectors
jQuery.expr.pseudos.regex = jQuery.expr.createPseudo(function (expression) {
    return function (elem) {
        var matchParams = expression.split(','),
            validLabels = /^(data|css):/,
            attr = {
                method: matchParams[0].match(validLabels) ?
                    matchParams[0].split(':')[0] : 'attr',
                property: matchParams.shift().replace(validLabels, '')
            },
            regexFlags = 'ig',
            regex = new RegExp(matchParams.join('').replace(/^\s+|\s+$/g, ''), regexFlags);
        return regex.test(jQuery(elem)[attr.method](attr.property));
    }
});

// Find the JSON export linl on the page;
let exportFormats = JSON.parse($("div#recordExportDownload")[0].attributes["data-formats"].value);

let jsonUrl;
for (let exportFormat of exportFormats) {
  if (exportFormat.name === "JSON") {
    jsonUrl = window.location.protocol + '//' + window.location.hostname + exportFormat.export_url;
  }
}
console.log(jsonUrl);

let identifier;
let doi;
let allFileNames;
  

let recordJson = {}
let unknownRelated;
fetch(jsonUrl, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  })
  .then(resp => resp.json())
  .then(json => {
    console.log(json);
    if ('metadata' in json) {
      console.log('And we have a winner!');
      recordJson = json;
    }
    // Find the DOI
    if ("doi" in recordJson.pids) {
      doi = recordJson.pids.doi.identifier;
      identifier = "https://doi.org/" + doi;
    } else {
      doi = "MISSING_DOI";
      identifier = doi;
    }

    allFileNames = listContent(recordJson);

    console.log(recordJson.metadata);
    console.log(allFileNames);

    /*
    console.log('missing related DOIs according to Infoscience', relatedItemsNotOnInfoscience(recordJson));

    addButtons();
    */

    relatedItemsNotOnInfoscience(recordJson).then(result => {
      unknownRelated = result;
      console.log('missing related identifiers according to Infoscience', unknownRelated);
      addButtons();
    });
  })
  .catch(err => console.error(err));


function addCheckElement(selector, checkCode, position, normal) {
  /**
   * Add checkbuttons next to a DOM element
   */
  let checkElement;
  // see if we can get a non-neutral answer for the current criterion
  let status = policyCheck(checkCode);

  let myHtml;

  if (normal) {
    //checkElement = $(`<${checklistData[checkCode].wrapper}>${checklistData[checkCode].short}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].wrapper}>`);
    myHtml = $(`<div class="btn-group" id="${checkCode}"/>`);

    myHtml.append(`<label class="btn btn-danger" id='bad' name="${checklistData[checkCode].category}">${buttonValues[status][0]}</label>`);
    myHtml.append(`<label class="btn btn-light" id="undecided" name="${checklistData[checkCode].category}">${buttonValues[status][1]}</label>`);
    myHtml.append(`<label class="btn btn-success" id='ok' name="${checklistData[checkCode].category}">${buttonValues[status][2]}</label>`);

    //checkElement = $(`<${checklistData[checkCode].wrapper}>${checklistData[checkCode].short}${myHtml}</${checklistData[checkCode].wrapper}>`);
    checkElement = $(`<${checklistData[checkCode].wrapper}>`);
    checkElement.append($(`${checklistData[checkCode].short}`));
    checkElement.append(myHtml);
  } else {
    //checkElement = $(`<${checklistData[checkCode].altwrapper}>${checklistData[checkCode].altshort}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].altwrapper}>`);    
    myHtml = $(`<div class="btn-group" id="${checkCode}"/>`);

    myHtml.append(`<label class="btn btn-danger" id='bad' name="${checklistData[checkCode].category}">${buttonValues[status][0]}</label>`);
    myHtml.append(`<label class="btn btn-light" id="undecided" name="${checklistData[checkCode].category}">${buttonValues[status][1]}</label>`);
    myHtml.append(`<label class="btn btn-success" id='ok' name="${checklistData[checkCode].category}">${buttonValues[status][2]}</label>`);

    //checkElement = $(`<${checklistData[checkCode].altwrapper}>${checklistData[checkCode].altshort}${myHtml}</${checklistData[checkCode].wrapper}>`);
    checkElement = $(`<${checklistData[checkCode].altwrapper}>`);
    checkElement.append($(`${checklistData[checkCode].altshort}`));
    checkElement.append(myHtml);


  }
  checkElement.attr('title', checklistData[checkCode].full);
  checkElement.tooltip();
  if (position == 'before') {
    selector.prepend(checkElement);
  } else {
    selector.append(checkElement);
  }
}

function addButtons() {

  var btn = document.createElement('BUTTON');
  var t = document.createTextNode('Prepare curation feedback e-mail');
  var frm = document.createElement('FORM');
  var icn = document.createElement('I');


  icn.setAttribute('class', 'fa fa-external-link');
  btn.setAttribute('class', 'btn btn-info btn-block sidebar-container');
  btn.appendChild(icn);
  btn.appendChild(t);
  frm.appendChild(btn);

  frm.addEventListener('click', function(event) {

    //var collapse = document.getElementById('collapseTwo'); 

    var zenodoURL = window.location.href;
    let title = document.title.replace(' | Zenodo', '');
    if (title == 'Zenodo') {
      let possibleTitle = $('h2.request-header');
      if (possibleTitle.length) {
        title = possibleTitle.text();
        identifier = 'unpublished'
      }
    }
    console.log(title);
    console.log(zenodoURL);

    let emailTo = 'info@zenodo.org';
    let emailSub = 'Zenodo dataset submitted to the EPFL community';

    var text = '';
    event.preventDefault();

    
    for (let checkLevel of checkLevels) {
      console.log('check level', checkLevel.short); 
      let checkArray = [];
      let checkBoxUnchecked = $(`label[name="${checkLevel.short}"][id='ok']:not(:contains("x"))`);
      checkBoxUnchecked.each(function() {
        let checkID = $(this).parent().attr('id');
        let actualButton = $(this).parent().children('label:not(:contains(" "))');
        let actualValue1 = actualButton.attr('id');
        let actualValue2 = actualButton.text();
        console.log(checkID, actualValue1, actualValue2, '==>', state2checkValue(actualValue1, actualValue2));
        checkArray.push([checkID, checklistData[checkID].full, checklistData[checkID].answers[state2checkValue(actualValue1, actualValue2)]]);
      });
      if (checkArray.length) {
        checkArray.sort();
        text += `Total ${checkArray.length} ${checkLevel.full} criteria not fully met:\n`;
        for (let element of checkArray) {
          text += `**${element[0]}: ${element[1]}**\n=> ${element[2]}\n\n`;
        }
      }
    }

    let now = new Date();
    let greeting;
    if (now.getHours() < 12) {
      greeting = "Good morning";
    } else if (now.getHours() > 16) {
      greeting = "Good evening";
    } else if (now.getHours() > 12) {
      greeting = "Good afternoon";
    } else {
      greeting = "Hello"
    }

    let header = ''
    let footer = ''
    let infoscienceReport = ''
    emailSub += encodeURIComponent(': ' + title);
    if (text == '') {
      // When all checkbuttons are set to ok, prepare the most positive feedback
      header += `${greeting},\n\nYou are designated as EPFL creators for "${title}" (${identifier}), which has been submitted to the EPFL Community on Zenodo. Thanks for this contribution! It is my pleasure to report that the dataset meets all of our quality requirements and is now accepted in the collection.\n\n`;
      header += 'As per our new workflow, the dataset will also be listed on Infoscience by our staff. The record will be submitted for approval to your laboratory, similar to the process followed by publications imported from external sources (Web of Science, Scopus, OpenAlex...).\n\n'
      header += 'XXX CHECK IF APPLICABLE XXX '
      header += 'Furthermore, considering that the dataset is linked to a publication, we will also archive a copy of the dataset for long-time preservation in EPFL\'s ACOUA platform (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info).\n'
      header += '\n\n'
      header += 'If you have any question about these steps, do not hesitate to ask!\n'

    } else {
      // If even one checkbutton is not OK, there will be more to say
      header += `${greeting},\n\nYou are designated as EPFL creators for "${title}" (${identifier}), which has been submitted to the EPFL Community on Zenodo.`;
      header += ' We thank you and your coworkers for this contribution.\n\n'
      header += 'Within our curation procedure ( https://zenodo.org/communities/epfl/about ), we have identified a few details that could be improved:\n\n';

      if (unknownRelated.length > 1) {
        console.log('unknownRelated:', unknownRelated, unknownRelated.length)
        infoscienceReport = 'Apparently, the following related publications are not yet listed on Infoscience:\n* ' + unknownRelated.join('\n* ') + '\n\n';
        infoscienceReport += 'Assuming that they are EPFL publications, we strongly recommend submitting them on https://infoscience.epfl.ch/mydspace to make sure the database is fully up-to-date.\n';
        infoscienceReport += '(See https://go.epfl.ch/how-submit-infoscience if you are not familiar with entering new records on Infoscience)\n\n';
      }

      if (unknownRelated.length == 1) {
        console.log('unknownRelated:', unknownRelated, unknownRelated.length)
        infoscienceReport = 'Apparently, the following related publication is not yet listed on Infoscience:\n* ' + unknownRelated.join('\n* ') + '\n\n';
        infoscienceReport += 'Assuming that this is an EPFL publication, we strongly recommend submitting it on https://infoscience.epfl.ch/mydspace to make sure the database is fully up-to-date.\n';
        infoscienceReport += '(See https://go.epfl.ch/how-submit-infoscience if you are not familiar with entering new records on Infoscience)\n\n';
      }

      footer += 'When the above feedback is addressed, we will be able to add value to your results and potentially save some of your time:\n';
      footer += '    •   we create Infoscience records for datasets newly accepted into the EPFL community, so that they are available for web pages, activity reports, etc.\n';
      footer += '    •   if the upload is related with a publication and if the distribution license allows it, we can take advantage of this situation to copy the data into EPFL\'s long time archive ACOUA (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info) without any administrative burden for the authors.\n';
      footer += 'Please note that we cannot keep a case open for an indefinite time: we need your input regarding the possible delays.'
      footer += ' If our messages are left unanswered for too long, we will process the submission according its current state.'
      footer += ' If you would like us to re-open the case after an update on your side, just let us know and we will be happy to do so.'
      footer += '\n\nIf you have any questions or comments about this service, do not hesitate to ask. We will be glad to answer or receive your feedback.\n\n'
    }
    footer += 'Best regards,\nZZZZZZ'

    text = header + text + infoscienceReport + footer;
    let finalURL = 'mailto:' + emailTo + '?&subject=' + emailSub + '&body=' + encodeURIComponent(text);
    // console.log(finalURL);
    openMailEditor(finalURL);
  })

  /**
  Main Greasemoneky section
  For all criteria, identify the relevant DOM element and insert the checkbuttons and short text using addCheckElement()
  The checkbuttons can be inserted 'before' or 'after' the selected DOM element
  */


  let menu;
  if (document.URL.match(/record/g)) {
    console.log("locate menu: this is a record");
    menu = $('aside.sixteen.wide.tablet.five.wide.computer.column.sidebar')[0];
  }
  if (document.URL.match(/request/g)) {
    // TODO using this definition messes up with the formatting of the "Edit" button => it could be prettier
    menu = $('div#request-actions')[0];
    console.log("locate menu: this is a request");
  }

  menu.prepend(frm);

    // This one should always be there, let's use it as a reference point

  let importantFrame;
  if (document.URL.match(/record/g)) {
    importantFrame = $('section#metrics');
  }
  if (document.URL.match(/request/g)) {
    // TODO using this definition messes up with the formatting of the "Edit" button => it could be prettier
    importantFrame = $('h2:contains("Versions")').parent();
  }

  let mainTitle = $('h1#record-title');
  let authorList = $('section#creatibutors');
  if (authorList.length) {
    addCheckElement(authorList, 'M1', 'after', true);
  }

  let contentChecks = $('<div>');
  
  let contentElement = $('section#record-files');
  console.log('files heading?', contentElement);
  if (contentElement.length == 0) {
    contentElement = $('div#files-list-accordion-trigger');
    console.log('contentElement:', contentElement);
  }
  addCheckElement(contentChecks, 'M3', 'after', true);

  let abstract = $('section#description');
  if (abstract.length) {
    addCheckElement(abstract, 'M4', 'before', true);
    abstract.prepend($('<div>----------------------------------------------------------------------------------------------------------------------------------</div>'));
  } else {
    addCheckElement(importantFrame, 'M4', 'after', false);
  }

  if (authorList.length) {
    addCheckElement(authorList, 'M2', 'after', true);
    addCheckElement(authorList, 'R1', 'after', true);
  }

  if (contentElement.length) {
    addCheckElement(contentChecks, 'M5', 'after', true);
    addCheckElement(contentChecks, 'R5', 'after', true);
  }

  let doiElement = $('div#record-versions');
  if (doiElement.length) {
    addCheckElement(doiElement, 'M6', 'before', true);
  }

  if (mainTitle.length) {
    addCheckElement(mainTitle, 'R2', 'after', true);
  }

  let license = $('div#licenses');
  if (license.length) {
    addCheckElement(license, 'N2', 'after', true);
  } else {
    addCheckElement(importantFrame, 'N2', 'after', false);
  }

  let relativeIdentifiers = $('h3:contains("Related works")');
  if (relativeIdentifiers.length) {
    addCheckElement(relativeIdentifiers, 'R3', 'after', true);
  } else {
    addCheckElement(importantFrame, 'R3', 'after', false);
  }

  let grants = $('h3:contains("Funding")');
  if (grants.length) {
    addCheckElement(grants, 'R4', 'after', true);
  } else {
    addCheckElement(importantFrame, 'R4', 'after', false);
  }

  if (contentElement.length) {
    addCheckElement(contentChecks, 'N1', 'after', true);
    addCheckElement(contentChecks, 'N3', 'after', true);
  }

  let thesisUniversity = $('dt:contains("Awarding university")');
  if (thesisUniversity.length) {
    addCheckElement(thesisUniversity, 'N4', 'after', true);
  } else {
    addCheckElement(importantFrame, 'N4', 'after', false);
  }

  if (contentElement.length) {
    addCheckElement(contentChecks, 'N5', 'after', true);
    let referencesWarning = '<div><b>Do not forget to check the references box at the bottom of the page...</b></div>';
    contentChecks.append(referencesWarning);
  }

  //let referencesElement = $('div#references-accordion-trigger');
  let referencesElement = $('h3:contains("References")');
  if (referencesElement.length) {
    addCheckElement(referencesElement, 'N6', 'after', true);
  } else {
    addCheckElement(importantFrame, 'N6', 'after', false);
  }

  let keywords = $('h2:contains("Keywords and subjects")');
  if (keywords.length) {
    addCheckElement(keywords, 'N7', 'after', true);
  } else {
    addCheckElement(importantFrame, 'N7', 'after', false);
  }

  contentElement.prepend(contentChecks);

  /**
  End of the main Greasemonkey section
  */

  /**
  Detect click on a checkbutton, change its value (circling between x, ? and empty) and clear its siblings if necessary
  */
  $('div.btn-group label.btn').on('click', function myclick(event) {
    console.log('click detected', event);
    console.log('in group selector', $(this).parent().attr('id'), $(this).attr('id'));
    if ($(this).text() != 'x') {
      $(this).siblings().text(' ');
      //Process button click event
      $(this).text('x');
    } else {
      $(this).text('?');
    }
  });

}


function openMailEditor(url) {
  // Simply use the mailto URL
  location.href = url;
}


function policyCheck(checkCode) {
  /**
  Automatic checks: will return 'neutral' by default.
  The logic must be adapated to each criterion, not all of them can be automated.
  */
  if (checkCode == 'M1') {
    // Check EPFL creators. Acceptable if there is at least one, OK if all (more than 1) creators are EPFL
    let epflCreators = 0;
    for (let creator of recordJson.metadata.creators) {
      if ('affiliations' in creator) {
        for (let affiliation of creator.affiliations) {
          if (affiliation.name.includes('EPFL') || affiliation.name.match(/[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne/)) {
            epflCreators += 1;
          }
        }
      }
    }
    if (epflCreators == recordJson.metadata.creators.length) {
      return 'ok';
    }
    if (epflCreators) {
      return 'maybe';
    }
    return 'meh';
  }

  if (checkCode == 'M3') {
    // Check access to the files
    // IDEA it could be useful to check whether the license is consistent with the access rights
    let noAccess = $('div.panel-body:contains("Files are not publicly accessible.")');
    let embargoAccess = $('div.panel-body:contains("Files are currently under embargo")');
    if (noAccess.length || embargoAccess.length) {
      return 'bad';
    } else {
      // we might have password-protected files - be careful
      return 'maybe';
    }
  }

  if (checkCode == 'M2') {
    let orcidEpflCreators = 0;
    for (let creator of recordJson.metadata.creators) {
      if ('affiliations' in creator) {
      for (let affiliation of creator.affiliations) {
        if (affiliation.name.includes('EPFL') || affiliation.name.match(/[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne/)) {
          if ('identifiers' in creator.person_or_org) {
            for (let identifier of creator.person_or_org.identifiers) {
              if (identifier.scheme.toLowerCase() == 'orcid') {
                orcidEpflCreators += 1;
              }
            }
          }
        }
      }
      }
    }
    console.log('epfl orcids', orcidEpflCreators);
    if (orcidEpflCreators) {
      return 'ok';
    }
    if ('description' in recordJson.metadata) {
      if (recordJson.metadata.description.includes('@epfl.ch')) {
        return 'maybe';
      }
    }
    return 'bad';
  }

  if (checkCode == 'M4') {
    // If the abstract is missing entirely, it's bad.
    if ('description' in recordJson.metadata) {
      return 'maybe';
    } else {
      return 'bad';
    }
  }

  if (checkCode == 'M5') {
    // Try to find a README
    // This will not check the content of Zips or other archive files
    let readmeFound = 'neutral';
    $('a:regex(href, records/.*/files/)').each(function() {
      let f = $(this).text().toLowerCase();
      // console.log([f], f.indexOf('readme'));
      if ((f.indexOf('readme') >= 0) && (f.indexOf('readme') < 4)) {
        // console.log('should be OK');
        readmeFound = 'ok';
      }
    });
    return readmeFound;
  }

  if (checkCode == 'M6') {
    let originalZenodoDoi = 'bad';
    if (doi.match(/^10\.5281\/zenodo/g) || doi.match(/^10\.5072\/zenodo/g)) {
      originalZenodoDoi = 'ok';
    }
    return originalZenodoDoi;
  }


  if (checkCode == 'N2') {
    // Licenses: check for one of the better ones.
    // Bad if there is no license at all.
    const goodLicenses = ['cc0-1.0', 'cc-by-4.0', 'cc-by-sa-4.0', 'mit', 'bsd-3-clause', 'gpl'];
    try {
      if (goodLicenses.includes(recordJson.metadata.rights[0].id.toLowerCase())) {
        return 'ok';
      }
    } catch (error) {
      console.log('License check error', error);
      return 'bad';
    }

  }

  if (checkCode == 'N4') {
    if ($("dt:contains('Awarding University:')").length) {
      if ($("h5:contains('Thesis supervisor(s)')").nextAll('p').html().match(/<span/g).length) {
        return 'ok';
      }
    }

  }

  if (checkCode == 'N7') {
    // Keywords: if there is only one string and it contains a comma or a semicolon, it is probably bad
    //let kw = $( "dd a.label-link span.label" );
    if ('subjects' in recordJson.metadata) {
      let kw = recordJson.metadata.subjects;
      console.log(kw);
      if (kw.length == 0) {
        return 'meh';
      }
      if (kw.length == 1) {
        if (!('scheme' in kw[0])) {
          if (kw[0].includes(',')) {
            return 'bad';
          }
          if (kw[0].includes(';')) {
            return 'bad';
          }
        } else {
          return 'ok'
        }
      }
      if (kw.length == 2) {
        return 'maybe';
      }
      if (kw.length > 2) {
        return 'ok';
      }
    } else {
      return 'meh';
    }

  }

 if (checkCode == 'R1') {
    // Check for ORCID iDs
    // At least one creator with ORCID = maybe. All creators with ORCID = OK
    let orcidCreators = 0;
    for (let creator of recordJson.metadata.creators) {
      if ("identifiers" in creator.person_or_org) {
        for (let identifier of creator.person_or_org.identifiers) {
          if (identifier.scheme.toLowerCase() == 'orcid') {
            orcidCreators += 1;
          }
        }
      }
    }
    if (orcidCreators == recordJson.metadata.creators.length) {
      return 'ok';
    }
    if (orcidCreators) {
      return 'maybe';
    } else {
      return 'bad';
    }
  }

  if (checkCode == 'R3') {
    // check for related identifier (experimental)
    // 2025-07-30 at this point, give a green light if there is at least one related identifier
    if ('related_identifiers' in recordJson.metadata) {
      for (let relatedResource of recordJson.metadata.related_identifiers) {
        if ('id' in relatedResource) {
          if (relatedResource.resource_type.id == "publication") {
            return 'ok'
          }
        }
      }
      return 'maybe';
    } else {
      // In the absence of any related identifier, a DOI in the description is suspiscious.
      // Unless it is the object's DOI itelf => negative look ahead needed
      function escapeRegex(string) {
        return string.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
      }
      let doiAfterTen = doi.slice(3);
      let re = new RegExp(String.raw`doi\.org\/10\.(?!${escapeRegex(doiAfterTen)})`, "g");
      if ('description' in recordJson.metadata) {
        if (recordJson.metadata.description.match(re)) {
          return 'meh';
        }
      }
    }
  }

  if (checkCode == 'R4') {
    // check for funding information
    // 2025-07-30 at this point, give a green light if there is at least one structured funding field
    if ('funding' in recordJson.metadata) {
      for (let grant of recordJson.metadata.funding) {
        if (grant.funder.id) {
          if ('award' in grant) {
            return 'ok';
          } else {
            return 'maybe'
          }
          
        }
      } 
    }
  }

  // Default value if nothing else was noticed
  return 'neutral';

}

function listContent(recordJson) {
  /**
  List the content of a Zenodo record
  */
  let filenames = [];
  let previewDocument;
  // let archive_extensions = ["zip", "gz","tar", "7z", "bz2"];
  // Zenodo only previews Zip files at the moment
  let archive_extensions = ["zip"];
    // There will be no entries for restricted access objects
    if ('entries' in recordJson.files) {
    for (let file of Object.keys(recordJson.files.entries)) {
      console.log(recordJson.files.entries[file]["ext"]);
      if (archive_extensions.indexOf(recordJson.files.entries[file]["ext"]) > -1) {
        console.log('Archive found', file);
        let previewUrl = recordJson.links.self_html + '/preview/' + file;
        console.log(previewUrl);
        fetch(previewUrl, {
            method: 'GET',
          })
          .then(resp => resp.text())
          .then(text => {
            const parser = new DOMParser();
            previewDocument = parser.parseFromString(text, 'text/html');
            let allcontent = ulTreeToPathList($(previewDocument).find("ul.tree"));
            console.log(allcontent)
            filenames.push(...allcontent);
          })
          .catch(err => console.error(err));



        } else {
          console.log('File found', file);
          filenames.push(file);
        }
      }
    }
    
    return filenames;
  }


function ulTreeToPathList($ul, basePath = '') {
  // 2025-08-04 this seems to work when called on a preview page as ulTreeToPathList($('url.tree'))
  const paths = [];
  
  // Find all direct li children of this ul
  $ul.children('li').each(function() {
      const $li = $(this);
      $li.children('div').children('div.row').each(function() {
          let $item = $(this).children('div, a');
          const nodeName = $item.first().text().trim();
          // console.log('we have a', [$item.first().prop('tagName')], 'named', [nodeName]);
          let currentPath = basePath ? basePath + '/' + nodeName : nodeName;

          // console.log(['basePath:', basePath]);
          // console.log(['currentPath:', currentPath]);
          
      
          // Check if this li has nested ul children
          let $childUl = [];
          if ($item.first().prop('tagName') === 'A') {
              $childUl = $li.find('ul').first();
          }
      
          if ($childUl.length > 0) {
              // Recursively process nested ul elements and merge results
              const childPaths = ulTreeToPathList($childUl, currentPath);
              paths.push(...childPaths);
          } else {
              // Leaf node - add the complete path
              paths.push(currentPath);
          }
      })
      
  });
  
  return paths;
}

async function listedOnInfoscience(identifier, idScheme) {
  // Check whether a record for the listed identifier already exists on Infoscience
  // Public API calls => only published records will be detected, not workspace items 
  let isPresent;
  let normalizedIdentifier;
  // By default, use the identifier directly, unless the scheme has further requirements
  switch (idScheme) {
    case 'doi':
      normalizedIdentifier = doiNormalize(identifier);
      break;
    case 'arxiv':
      normalizedIdentifier = arxivNormalize(identifier);
      break;
    default:
      normalizedIdentifier = identifier;   
  }

  console.log(idScheme, normalizedIdentifier)

  let searchURL = 'https://infoscience.epfl.ch/server/api/discover/search/objects?query=dc.identifier.' + idScheme + '%3A%22' + encodeURIComponent(normalizedIdentifier) + '%22';
  console.log(searchURL);
  await fetch(searchURL, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  })
  .then(resp => resp.json())
  .then(json => {
    if (json._embedded.searchResult._embedded.objects.length > 0) {
      console.log(doi, 'yep')
      isPresent = true
    } else {
      isPresent = false
    }
  })
  return isPresent;
}

async function relatedItemsNotOnInfoscience(recordJson) {
  // check all related identifiers with: 
  // 1) publication-like resource types
  // 2) publication-oriented identifier schemes
  // Returns the ones not publicly listed on Infoscience (adding the scheme in capitals)

  const relevantResourceTypes = ['publication',
                                 'publication-annotationcollection',
                                 'publication-article',
                                 'publication-book',
                                 'publication-conferencepaper',
                                 'publication-datamanagementplan',
                                 'publication-deliverable',
                                 'publication-milestone',
                                 'publication-other',
                                 'publication-patent',
                                 'publication-preprint',
                                 'publication-proposal',
                                 'publication-report',
                                 'publication-section',
                                 'publication-softwaredocumentation',
                                 'publication-taxonomictreatment',
                                 'publication-technicalnote',
                                 'publication-thesis',
                                 'publication-workingpaper',
                                 'presentation', 
                                 'poster'];
        
  const relevantIdSchemes = ['doi', 'arxiv', 'isbn', 'pmid'];

  let infoscienceMissingRelated = [];
  
  if ('related_identifiers' in recordJson.metadata) {
    for (let relatedResource of recordJson.metadata.related_identifiers) {
      // TODO MAYBE define behavior if no resource_type was provided?
      // TODO MAYBE exclude Zenodo/Dryad/etc. DOIs in that case?
      console.log(relatedResource);
      if ('resource_type' in relatedResource) {
        if (relevantResourceTypes.indexOf(relatedResource.resource_type.id) > -1) {
          console.log(relatedResource.resource_type.id);
          if (relevantIdSchemes.indexOf(relatedResource.scheme) > -1) {
            let isPresent = await listedOnInfoscience(relatedResource.identifier, relatedResource.scheme);
            if (!isPresent) {
              infoscienceMissingRelated.push(relatedResource.scheme.toUpperCase() + ': ' + relatedResource.identifier);
            }
          }
        }
      }
    }
  }
  
  return infoscienceMissingRelated;
}


// Adapted from https://github.com/altmetric/identifiers-arxiv
function arxivNormalize(str) {

  function extractPre2007Ids(str) {
    return extractIds(str, /(?:^|\s|\/)((?:arXiv:)?[a-z-]+(?:\.[A-Z]{2})?\/\d{2}(?:0[1-9]|1[012])\d{3}(?:v\d+)?(?=$|\s))/gi);
  }

  function extractPost2007Ids(str) {
    return extractIds(str, /(?:^|\s|\/)((?:arXiv:)?\d{4}\.\d{4,5}(?:v\d+)?(?=$|\s))/gi);
  }

  function extractIds(str, re) {
    let match = [];
    let matches = [];
    while ((match = re.exec(str)) !== null) {
        matches.push(match[1]);
    }
    return matches.map(stripScheme);
  }

  function stripScheme(str) {
    return str.replace(/^arXiv:/i, "");
  }

  return extractPre2007Ids(str).concat(extractPost2007Ids(str));
}


// Adapted from https://github.com/altmetric/identifiers-doi
function doiNormalize(str) {

  const PATTERN = "\\b10\\.(?:97[89]\\.\\d{2,8}\\/\\d{1,7}|\\d{4,9}\\/\\S+)";
  const GLOBAL_PATTERN = new RegExp(PATTERN, "g");
  const SINGLE_PATTERN = new RegExp(PATTERN);
  
  function extractOne(str) {
    const match = String(str).toLowerCase().match(SINGLE_PATTERN);
    if (!match) {
        return;
    }
    return stripPunctuation(match[0]);
  }

  function stripPunctuation(doi) {
    const VALID_ENDING = /(?:\w|\(.+\)|2-#)$/;
    if (VALID_ENDING.test(doi)) {
        return doi;
    }
    return extractOne(doi.replace(/\W$/, ""));
  }

  const matches = String(str).toLowerCase().match(GLOBAL_PATTERN);
  if (!matches) {
        return [];
  }

  return matches.map(stripPunctuation).filter(Boolean);
}
