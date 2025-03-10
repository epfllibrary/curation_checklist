// ==UserScript==
// @name        Zenodo Curation Checklist
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/records/*
// @include     https://sandbox.zenodo.org/records/*
// @include     https://zenodo.org/communities/epfl/requests/*
// @include     https://sandbox.zenodo.org/communities/epfl/requests/*
// @include     https://zenodo.org/me/requests/*
// @include     https://sandbox.zenodo.org/me/requests/*
// @grant       none
// @version     1.4.4
// ==/UserScript==

// MAYBE use https://stackoverflow.com/questions/18231259/how-to-take-screen-shot-of-current-webpage-using-javascript-jquery ?

// TODO add standardized comments for non-compliant results where possible
// TODO: find ideas to check criteria M3, R3 (look for patterns in the description?), N1 (if we find a comment about grant in the description), N2 (maybe a quick look at the files for the worst offenders: ._*, *.bak, ...), N6 (maybe lists based on the Fastguide)
// R5, N4 better left out of automatic checking
// MAYBE: better explanation of Infoscience validation

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
      'bad': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/record/298249',
      'meh': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/record/298249',
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


// Find the DOI on the page
let doi = $('h4 pre:first').text();

// Dummy record in case the metadata retrieval fails
let recordJson = {
  'data': {
    'id': 'XXX',
    'type': 'dummy',
    'attributes': {
      'doi': 'XXX',
      'prefix': 'XXX',
      'suffix': '',
      'identifiers': [],
      'alternateIdentifiers': [],
      'creators': [],
      'titles': [
        {
          'title': 'DUMMY TITLE'
        }
      ],
      'publisher': '',
      'container': {},
      'publicationYear': 2023,
      'subjects': [],
      'contributors': [],
      'dates': [{ 'date': '2023', 'dateType': 'Issued' }],
      'language': 'en',
      'types': {
        'ris': 'RPRT',
        'bibtex': 'article',
        'citeproc': 'article-journal',
        'schemaOrg': 'ScholarlyArticle',
        'resourceType': 'Documentation',
        'resourceTypeGeneral': 'Text'
      },
      'relatedIdentifiers': [],
      'relatedItems': [],
      'sizes': [],
      'formats': [],
      'version': null,
      'rightsList': [{'rights': 'none', 'rightsIdentifier': 'none'}],
      'descriptions': [{
                'description': 'empty',
                'descriptionType': 'Abstract'
            }],
      'geoLocations': [],
      'fundingReferences': [],
      'xml': '',
      'url': '',
      'contentUrl': null,
      'metadataVersion': 1,
      'schemaVersion': null,
      'source': null,
      'isActive': true,
      'state': 'findable',
      'reason': null,
      'viewCount': 0,
      'viewsOverTime': [],
      'downloadCount': 0,
      'downloadsOverTime': [],
      'referenceCount': 2,
      'citationCount': 6,
      'citationsOverTime': [],
      'partCount': 0,
      'partOfCount': 0,
      'versionCount': 0,
      'versionOfCount': 0,
      'created': '2023-07-06T07:00:00.000Z',
      'registered': '2023-07-06T07:00:00.000Z',
      'published': '2023',
      'updated': '2023-07-06T07:00:00.001Z'
    },
    'relationships': {
      'client': {
        'data': { 'id': 'datacite.datacite', 'type': 'clients' }
      },
      'provider': { 'data': { 'id': 'datacite', 'type': 'providers' } },
      'media': { 'data': { 'id': 'XXX', 'type': 'media' } },
      'references': {
        'data': []
      },
      'citations': {
        'data': []
      },
      'parts': { 'data': [] },
      'partOf': { 'data': [] },
      'versions': { 'data': [] },
      'versionOf': { 'data': [] }
    }
  }
};
console.log('doi', doi);
let identifier = 'https://doi.org/' + doi;
if (!doi.startsWith('10.5281/zenodo.')) {
  doi = 'dummy';
}
console.log('https://api.datacite.org/dois/' + doi);
addRequestRecordTab(identifier);

// Retrieve Datacite metadata
fetch('https://api.datacite.org/dois/' + doi, {
    method: 'GET',
    headers: {
      accept: 'application/json'
    }
  })
  .then(resp => resp.json())
  .then(json => {
    console.log(json);
    if ('data' in json) {
      console.log('And we have a winner!');
      recordJson = json;
    }
    addButtons();
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

function addRequestRecordTab(doiId) {
  /**
  Add a record tab in the Zenodo post-Oct. 2023 interface
   */
  var requestCommunitySubmissionTab = $('div#request-community-submission-tab');
  var fullRecordTabHtml = '<a href="' + doiId + '" target="_blank" role="tab" class="item" data-tab="fullrecord" aria-selected="false" aria-controls="full-record-tab-panel" id="full-record-tab">[SISB-RDM]Full record view</a>';
  requestCommunitySubmissionTab.append($(fullRecordTabHtml));

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


    let header = ''
    let footer = ''
    emailSub += encodeURIComponent(': ' + title);
    if (text == '') {
      // When all checkbuttons are set to ok, prepare the most positive feedback
      header += `Good XXX,\n\nYou are designated as EPFL creators for "${title}" (${identifier}), which has been submitted to the EPFL Community on Zenodo. Thanks for this contribution! It is my pleasure to report that the dataset meets all of our quality requirements and is now accepted in the collection.\n\n`;
      header += 'As per our new workflow, the dataset will also be listed on Infoscience by our staff. The record will be submitted for approval to your laboratory, similar to the process followed by publications imported from the Web of Science.\n\n'
      header += 'XXX CHECK IF APPLICABLE XXX '
      header += 'Furthermore, considering that the dataset is linked to a publication, we will also archive a copy of the dataset for long-time preservation in EPFL\'s ACOUA platform (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info).\n'
      header += '\n\n'
      header += 'If you have any question about these steps, do not hesitate to ask!\n'

    } else {
      // If even one checkbutton is not OK, there will be more to say
      header += `Good XXX,\n\nYou are designated as EPFL creators for "${title}" (${identifier}), which has been submitted to the EPFL Community on Zenodo.`;
      header += ' We thank you and your coworkers for this contribution.\n\n'
      header += 'Within our curation procedure ( https://zenodo.org/communities/epfl/about ), we have identified a few details that could be improved:\n\n';

      footer += 'When the above feedback is addressed, we will be able to add value to your results and potentially save some of your time:\n';
      footer += '    •   we create Infoscience records for datasets newly accepted into the EPFL community, so that they are available for web pages, activity reports, etc.\n';
      footer += '    •   if the upload is related with a publication and if the distribution license allows it, we can take advantage of this situation to copy the data into EPFL\'s long time archive ACOUA (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info) without any administrative burden for the authors.\n';
      footer += 'Please note that we cannot keep a case open for an indefinite time: we need your input regarding the possible delays.'
      footer += ' If our messages are left unanswered for too long, we will process the submission according its current state.'
      footer += ' If you would like us to re-open the case after an update on your side, just let us know and we will be happy to do so.'
      footer += '\n\nIf you have any questions or comments about this service, do not hesitate to ask. We will be glad to answer or receive your feedback.\n\n'
    }
    footer += 'Best regards,\nZZZZZZ'

    text = header + text + footer;
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
    menu = document.getElementsByClassName('sixteen wide tablet five wide computer column sidebar')[0];
  }
  if (document.URL.match(/request/g)) {
    // TODO using this definition messes up with the formatting of the "Edit" button => it could be prettier
    menu = document.getElementById('request-actions');
  }

  // console.log(menu);
  var metadata = document.getElementById('metrics');

  //menu.appendChild(btn);

  menu.insertBefore(frm, metadata);

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

  // This one should always be there, let's use it as a reference point

  let importantFrame;
  if (document.URL.match(/record/g)) {
    importantFrame = $('section#metrics');
  }
  if (document.URL.match(/request/g)) {
    // TODO using this definition messes up with the formatting of the "Edit" button => it could be prettier
    importantFrame = $('h2:contains("Versions")').parent();
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
    for (let creator of recordJson.data.attributes.creators) {
      for (let affiliation of creator.affiliation) {
        if (affiliation.includes('EPFL') || affiliation.match(/[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne/)) {
          epflCreators += 1;
        }
      }
    }
    if (epflCreators == recordJson.data.attributes.creators.length) {
      return 'ok';
    }
    if (epflCreators) {
      return 'maybe';
    }
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
    for (let creator of recordJson.data.attributes.creators) {
      for (let affiliation of creator.affiliation) {
        if (affiliation.includes('EPFL') || affiliation.match(/[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne/)) {
          for (let identifier of creator.nameIdentifiers) {
            if (identifier.nameIdentifierScheme == 'ORCID') {
              orcidEpflCreators += 1;
            }
          }
        }
      }
    }
    console.log('epfl orcids', orcidEpflCreators);
    if (orcidEpflCreators) {
      return 'ok';
    }
    if (recordJson.data.attributes.descriptions[0].description.includes('@epfl.ch')) {
      return 'maybe';
    }
    return 'bad';
  }

  if (checkCode == 'R1') {
    // Check for ORCID iDs
    // At least one creator with ORCID = maybe. All creators with ORCID = OK
    let orcidCreators = 0;
    for (let creator of recordJson.data.attributes.creators) {
      for (let identifier of creator.nameIdentifiers) {
        if (identifier.nameIdentifierScheme == 'ORCID') {
          orcidCreators += 1;
        }
      }
    }
    if (orcidCreators == recordJson.data.attributes.creators.length) {
      return 'ok';
    }
    if (orcidCreators) {
      return 'maybe';
    }
  }

  if (checkCode == 'M5') {
    // Try to find a README
    // This will not check the content of Zips or other archive files
    let readmeFound = 'neutral';
    $('a:regex(href, records/.*/files/)').each(function() {
      let f = $(this).text().toLowerCase();
      console.log([f], f.indexOf('readme'));
      if ((f.indexOf('readme') >= 0) && (f.indexOf('readme') < 4)) {
        console.log('should be OK');
        readmeFound = 'ok';
      }
    });
    return readmeFound;
  }


  if (checkCode == 'N2') {
    // Licenses: check for one of the better ones.
    // Bad if there is no license at all.
    const goodLicenses = ['cc0-1.0', 'cc-by-4.0', 'cc-by-sa-4.0', 'mit', 'bsd-3-clause', 'gpl'];
    try {
      if (goodLicenses.includes(recordJson.data.attributes.rightsList[0].rightsIdentifier.toLowerCase())) {
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
    try {
      let kw = recordJson.data.attributes.subjects;
      console.log(kw);
      if (kw.length == 0) {
        return 'meh';
      }
      if (kw.length == 1) {
        if (kw[0].includes(',')) {
          return 'bad';
        }
        if (kw[0].includes(';')) {
          return 'bad';
        }
      }
      if (kw.length > 2) {
        return 'ok';
      }
    } catch (error) {
      console.log('Unknown error in checkCode N7');
    }

  }

  // Default value if nothing else was noticed
  return 'neutral';

}