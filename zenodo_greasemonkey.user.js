// ==UserScript==
// @name        Zenodo Curation Checklist
// @require     https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.0/jquery.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/jquery-ui.min.js
// @require     https://cdnjs.cloudflare.com/ajax/libs/tinysort/3.2.8/tinysort.min.js
// @require     https://far-nyon.ch/assets/js/tinysort/src/jquery.tinysort.min.js
// @namespace   curation.epflrdm.zenodo
// @author      Alain Borel
// @include     https://zenodo.org/records/*
// @include     https://sandbox.zenodo.org/records/*
// @grant       none
// @version     1.2.3
// ==/UserScript==

// TODO use https://stackoverflow.com/questions/18231259/how-to-take-screen-shot-of-current-webpage-using-javascript-jquery ?

// TESTING get some functionality on the Zenodo sandbox (no longer working due to relying on Datacite metadata...

// TODO add standardized comments for non-compliant results where possible
// TODO: find ideas to check criteria M3, R3 (look for patterns in the description?), N1 (if we find a comment about grant in the description), N2 (maybe a quick look at the files for the worst offenders: ._*, *.bak, ...), N6 (maybe lists based on the Fastguide)
// R5, N4 better left out of automatic checking

const checkLevels = [{"short": "must", "full": "MUST (mandatory for acceptance into the collection)"}, {"short": "recommended", "full": "RECOMMENDED"}, {"short": "nth", "full": "NICE-TO-HAVE"}];

const checklistData = {
  "M1": {
    "full": "At least one author must be affiliated with EPFL at the time of the submission or creation of the submitted work",
    "short": "<b>EPFL authors?&nbsp;</b>",
    "answers": {
      "bad": "There is not enough evidence that the authors are or were affiliated with EPFL, we would be grateful for more details (for example an e-mail address or ORCID identifier)",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "must",
    "wrapper": "div"
  },
  "M2": {
    "full": "The content of the upload must be accessible for review, i.e. Open Access, or Restricted after an access request has been completed. Embargoed uploads will be reviewed after the embargo has expired",
    "answers": {
      "bad": "If we cannot access the content of the dataset, we cannot check its compliance with our curation criteria. Would it be possible to make it at least Restricted?",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "must",
    "short": "<b>Access to content?&nbsp;</b>",
    "wrapper": "div"
  },
  "M3": {
    "full": "The Description of the submitted upload must be sufficiently detailed. Mere references to external articles or other resources are not a sufficient description",
    "answers": {
      "bad": "For example, a few sentences explaining how the files were generated or used would be very helpful for a potential user. If the data was used in a publication, you could also include part of the article abstract, to make the scientific context more immediately apparent.",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "must",
    "short": "<b>Sufficient abstract?&nbsp;</b>",
    "wrapper": "div"
  },
  "M4": {
    "full": "If no ORCID is listed, the name and surname and EPFL email address of at least one author must be specified in the Description",
    "answers": {
      "bad": "Minimal contact information for an EPFL author must be available, please add it either using ORCID or in the Description.",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "must",
    "short": "<b>Email or ORCID for 1 EPFL author?&nbsp;</b>",
    "wrapper": "div"
  },
  "R1": {
    "full": "Authors are identified by their ORCID",
    "answers": {
      "bad": "By listing all authors with their respective ORCID, you make sure that they can be recognized unambiguously. If an EPFL author has no ORCID yet, we strongly suggest to create one: see https://actu.epfl.ch/news/link-your-orcid-profile-with-epfl/ for more info",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "recommended",
    "short": "<b>Authors with ORCID?&nbsp;</b>",
    "wrapper": "div"
  },
  "R2": {
    "full": "The title should be human-readable on the same level as conventional publications: filenames or coded expressions are deprecated",
    "answers": {
      "bad": "As for any scientific output, a good title is the first place where others will learn about the nature and purpose of your research. The same principles as for scientific papers are applicable.",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "recommended",
    "short": "<b>&nbsp;</b>",
    "wrapper": "span"
  },
  "R3": {
    "full": 'If existing, references to related publications (e.g., article, source code, other datasets, etc.) should specified in the "Related/alternate identifiers" field, using a DOI if available',
    "answers": {
      "bad": "The upload appears to related with a publication. If the final publication or a version of the manuscript is available online, it should be listed it in the 'Related/alternate identifiers' section - preferably using a DOI but a URL is fine if no DOI has been assigned to the publication. If no online version exists yet (even a preprint), can you give us an estimated time for the expected publication?",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "recommended",
    "short": "<b>&nbsp</b>;",
    "wrapper": "span",
    "altspan": "dt",
    "altshort": "<b>No related identifiers here, is it OK?&nbsp;</b>"
  },
  "R4": {
    "full": "In general, a README file should be present in the root directory, and in case the submission consists of a compressed file then it is external. The README file is not needed for records consisting in one single document which already contains enough information (such as publications, posters and presentation slides)",
    "answers": {
      "bad": "Such a file really facilitates a potential user's understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, while the presence of a README file is not mandatory for acceptance into the Community, it is a requirement for long-term archiving by EPFL's ACOUA system (further info at the end of this message).",
      "meh": "Such a file really facilitates a potential user's understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, while the presence of a README file is not mandatory for acceptance into the Community, it is a requirement for long-term archiving by EPFL's ACOUA system (further info at the end of this message).",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "recommended",
    "short": "<b>README present?&nbsp;</b>",
    "wrapper": "span"
  },
  "R5": {
    "full": "Any sensitive, personal data should have been anonymized",
    "answers": {
      "bad": "The upload contains personal data about human research subjects, which is forbidden by various laws. Make sure the access is strictly limited and/or replace the data with an anonymized version",
      "meh": "THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG",
      "maybe": "THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "recommended",
    "short": "<b>No sensitive data?&nbsp;</b>",
    "wrapper": "div"
  },
  "N1": {
    "full": 'If applicable, related grants should acknowledged using “Funding/Grants” fields',
    "answers": {
      "bad": "There are specific fields to list grants, it is better to use them than to write an acknowledgement in the description: it facilitates the automatic retrieval of that information on the funders' platfoms",
      "meh": "There is no mention of specific funding, which is fine if the project is operated using EPFL budget only. However, if some funding body (such as the Swiss National Science Foundation, some European program or other) is acknowledged in the publication it should be listed here as well.",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>&nbsp;</b>",
    "wrapper": "span",
    "altshort": "<b>No grants here, is it OK?&nbsp;</b>",
    "altwrapper": "dt",
    "selector": "dt:contains('Grants:')"
  },
  "N2": {
    "full": "The upload should have been cleaned up (e.g., there are no temporary or unnecessary empty files or folders, no superfluous file versions, etc.)",
    "answers": {
      "bad": "[ONE POSSIBLE CASE]This is just a suggestion at this point but is quite a frequent one for us: in the future, you might want to exclude .DS_Store and other similar MacOS files in your archives. The otherwise very convenient 'Compress' command in the OSX Finder makes it difficult to avoid this, but there are other tools that you could use instead, see https://apple.stackexchange.com/questions/239578/compress-without-ds-store-and-macosx for a few possible options.",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>Clean content?&nbsp;</b> ",
    "wrapper": "div"
  },
  "N3": {
    "full": "Permissive licenses are preferred (order of preference: CC0, CC-BY-4.0, CC-BY-SA-4.0 for data; MIT, BSD, GPL for code)",
    "answers": {
      "bad": "Limited access and re-usability are against the principles of Open Science endorsed by EPFL. Are you sure you cannot use a more liberal license?",
      "meh": "The chosen license limits the potential re-use of your data by others. There can be valid reasons for that, but in general we encourage the most open options",
      "maybe": "An unusual license was chosen for this upload, is there a reason why it was preferred over the better-known options?",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>&nbsp;</b>",
    "wrapper": "span",
    "altshort": "<b>No license, probably wrong&nbsp;</b>",
    "altwrapper": "dt"
  },
  "N4": {
    "full": "When a README file is advised, it could contain information such as the convention for files and folders naming, possible ontologies or controlled vocabularies, etc.",
    "answers": {
      "bad": "A good README can significantly improve a potential user's understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/record/298249 ",
      "meh": "A good README can significantly improve a potential user's understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/record/298249 ",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>Good README?&nbsp;</b> ",
    "wrapper": "div"
  },
  "N5": {
    "full": "If the submission is related to a PhD thesis, the supervisor should be specified",
    "answers": {
      "bad": "There are mentions of a PhD thesis, this should be formally declared using the relevant input field with the supervisor name and institution",
      "meh": "THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.",
      "maybe": "THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>&nbsp;| Supervisor listed?&nbsp;</b>",
    "wrapper": "span",
    "altshort": "<b>No thesis indication, probably fine&nbsp;</b>",
    "altwrapper": "dt"
  },
  "N6": {
    "full": "Files should be available in open formats",
    "answers": {
      "bad": "A potential user is more likely to be able to work with your data if it is available in open formats, since they will less restricted by some specific software choice. You can check our Fast Guide for examples https://infoscience.epfl.ch/record/265349/files/04_Formats_EPFL_Library_RDM_FastGuide.pdf",
      "meh": "NOT TOTALLY WRONG, BUT STILL...",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>Open file formats?&nbsp;</b> ",
    "wrapper": "div"
  },
  "N7": {
    "full": "Where applicable, sources from which the work is derived should be specified",
    "answers": {
      "bad": "It seems that the upload is derived from existing data. In such a case, the source of that data is best acknowledged using structured metadata: the 'Related/alternate identifiers' section is generally intended for digitial sources, the 'References' section can be used for other sources",
      "meh": "THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.",
      "maybe": "THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>&nbsp;Relevant sources?&nbsp;</b>",
    "wrapper": "span",
    "altshort": "<b>&nbsp;No \"References\" section, is this OK?&nbsp;</b>",
    "altwrapper": "span"
  },
  "N8": {
    "full": "Keywords should be entered as separated fields",
    "answers": {
      "bad": "To maximize the effectiveness of keywords, each concept must be listed a distinct entity: each entity will have its own link that leads to other records tagged with the same concept. This will not work if all keywords are combined as one single text entry.",
      "meh": "No keywords are listed, you might consider adding some. It will make it easier for potential users to discover the dataset (through search results or links from other datasets with the same keywords), and then to understand its context",
      "maybe": "NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE",
      "neutral": "OUBLI DANS LA CURATION: A VERIFIER! :-)",
      "ok": ""
    },
    "category": "nth",
    "short": "<b>&nbsp;</b>",
    "wrapper": "span",
    "altshort": "<b>No keywords here, is it OK?&nbsp;</b>",
    "altwrapper": "dt"
  }
};

const buttonValues = {
  'neutral': [' ', '?', ' '],
  'ok': [' ', ' ', 'x'],
  'maybe': [' ', ' ', '?'],
  'bad': ['x', ' ', ' '],
  'meh': ['?', ' ', ' ']
}

function state2checkValue(buttonID, value) {
  if (buttonID == 'bad' && value == 'x') {return "bad"};
  if (buttonID == 'bad' && value == '?') {return "meh"};
  if (buttonID == 'ok' && value == '?') {return "maybe"};
  if (buttonID == 'ok' && value == 'x') {return "ok"};
  return "neutral";
}


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

this.$ = this.jQuery = jQuery.noConflict(true);
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.13.2/themes/base/jquery-ui.min.css'));
$('head').append($('<link rel="stylesheet" type="text/css" />').attr('href', 'https://cdn.jsdelivr.net/npm/bootstrap@5.2.3/dist/css/bootstrap.min.css'));

$('head').append(checklistStyle);


let doi = $('h4 pre:first').text();

let recordJson = {
  "data": {
    "id": "XXX",
    "type": "dummy",
    "attributes": {
      "doi": "XXX",
      "prefix": "XXX",
      "suffix": "",
      "identifiers": [],
      "alternateIdentifiers": [],
      "creators": [],
      "titles": [
        {
          "title": "DUMMY TITLE"
        }
      ],
      "publisher": "",
      "container": {},
      "publicationYear": 2023,
      "subjects": [],
      "contributors": [],
      "dates": [{ "date": "2023", "dateType": "Issued" }],
      "language": "en",
      "types": {
        "ris": "RPRT",
        "bibtex": "article",
        "citeproc": "article-journal",
        "schemaOrg": "ScholarlyArticle",
        "resourceType": "Documentation",
        "resourceTypeGeneral": "Text"
      },
      "relatedIdentifiers": [],
      "relatedItems": [],
      "sizes": [],
      "formats": [],
      "version": null,
      "rightsList": [{"rights": "none", "rightsIdentifier": "none"}],
      "descriptions": [{
                "description": "empty",
                "descriptionType": "Abstract"
            }],
      "geoLocations": [],
      "fundingReferences": [],
      "xml": "",
      "url": "",
      "contentUrl": null,
      "metadataVersion": 1,
      "schemaVersion": null,
      "source": null,
      "isActive": true,
      "state": "findable",
      "reason": null,
      "viewCount": 0,
      "viewsOverTime": [],
      "downloadCount": 0,
      "downloadsOverTime": [],
      "referenceCount": 2,
      "citationCount": 6,
      "citationsOverTime": [],
      "partCount": 0,
      "partOfCount": 0,
      "versionCount": 0,
      "versionOfCount": 0,
      "created": "2023-07-06T07:00:00.000Z",
      "registered": "2023-07-06T07:00:00.000Z",
      "published": "2023",
      "updated": "2023-07-06T07:00:00.001Z"
    },
    "relationships": {
      "client": {
        "data": { "id": "datacite.datacite", "type": "clients" }
      },
      "provider": { "data": { "id": "datacite", "type": "providers" } },
      "media": { "data": { "id": "XXX", "type": "media" } },
      "references": {
        "data": []
      },
      "citations": {
        "data": []
      },
      "parts": { "data": [] },
      "partOf": { "data": [] },
      "versions": { "data": [] },
      "versionOf": { "data": [] }
    }
  }
};
console.log('doi', doi);
let identifier = 'https://doi.org/' + doi;
if (!doi.startsWith('10.5281/zenodo.')) {
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
    if ('data' in json) {
      console.log('And we have a winner!');
      recordJson = json;
    }
    addButtons();
  })
  .catch(err => console.error(err));


function addCheckElement(selector, checkCode, position, normal) {
  let checkElement;
  // see if we can get a non-neutral answer for the current criterion
  let status = policyCheck(checkCode);

  if (normal) {
    //checkElement = $(`<${checklistData[checkCode].wrapper}>${checklistData[checkCode].short}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].wrapper}>`);
    let myHtml = $(`<div class="btn-group" id="${checkCode}"/>`);

    myHtml.append(`<label class="btn btn-danger" id="bad" name="${checklistData[checkCode].category}">${buttonValues[status][0]}</label>`);
    myHtml.append(`<label class="btn btn-light" id="undecided" name="${checklistData[checkCode].category}">${buttonValues[status][1]}</label>`);
    myHtml.append(`<label class="btn btn-success" id="ok" name="${checklistData[checkCode].category}">${buttonValues[status][2]}</label>`);

    //checkElement = $(`<${checklistData[checkCode].wrapper}>${checklistData[checkCode].short}${myHtml}</${checklistData[checkCode].wrapper}>`);
    checkElement = $(`<${checklistData[checkCode].wrapper}>`);
    checkElement.append($(`${checklistData[checkCode].short}`));
    checkElement.append(myHtml);
  } else {
    //checkElement = $(`<${checklistData[checkCode].altwrapper}>${checklistData[checkCode].altshort}<input type="checkbox" name="${checklistData[checkCode].category}" class="check" value="${checkCode}" /></${checklistData[checkCode].altwrapper}>`);    
    myHtml = $(`<div class="btn-group" id="${checkCode}"/>`);

    myHtml.append(`<label class="btn btn-danger" id="bad" name="${checklistData[checkCode].category}">${buttonValues[status][0]}</label>`);
    myHtml.append(`<label class="btn btn-light" id="undecided" name="${checklistData[checkCode].category}">${buttonValues[status][1]}</label>`);

    //checkElement = $(`<${checklistData[checkCode].altwrapper}>${checklistData[checkCode].altshort}${myHtml}</${checklistData[checkCode].wrapper}>`);
    checkElement = $(`<${checklistData[checkCode].altwrapper}>`);
    checkElement.append($(`${checklistData[checkCode].altshort}`));
    checkElement.append(myHtml);


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
  var t = document.createTextNode('Prepare curation feedback e-mail');
  var frm = document.createElement('FORM');
  var icn = document.createElement('I');


  icn.setAttribute('class', "fa fa-external-link");
  btn.setAttribute('class', "btn btn-danger btn-block sidebar-container");
  btn.appendChild(icn);
  btn.appendChild(t);
  frm.appendChild(btn);

  frm.addEventListener("click", function(event) {

    var collapse = document.getElementById('collapseTwo'); 

    var zenodoURL = window.location.href;
    let title = document.title.replace(' | Zenodo', '');
    console.log(title);
    console.log(zenodoURL);

    let emailTo = 'info@zenodo.org';
    let emailSub = 'Zenodo dataset submitted to the EPFL community';

    var text = '';
    event.preventDefault();

    const MustCheckboxUnchecked = $('label[name="must"][id="ok"]:not(:contains("x"))');
    const MustCheckboxBad = $('label[name="must"][id="bad"]:contains("x")');
    const RecommendedCheckboxUnchecked = $('label[name="recommended"][id="ok"]:not(:contains("x"))');
    const RecommendedCheckboxBad = $('label[name="recommended"][id="bad"]:contains("x")');
    const NTHCheckboxUnchecked = $('label[name="nth"][id="ok"]:not(:contains("x"))');
    const NTHCheckboxBad = $('label[name="nth"][id="bad"]:contains("x")');
    
    for (let checkLevel of checkLevels) {
      console.log('check level', checkLevel.short); 
      let checkArray = [];
      let checkBoxUnchecked = $(`label[name="${checkLevel.short}"][id="ok"]:not(:contains("x"))`);
      let checktArray = [];
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



    let header = ""
    let footer = ""
    emailSub += encodeURIComponent(': ' + title);
    if (text == "") {
      header += `Good XXX,\n\nYou are designated as EPFL creators for \"${title}\" (${identifier}), which has been submitted to the EPFL Community on Zenodo. Thanks for this contribution! It is my pleasure to report that the dataset meets all of our quality requirements and is now accepted in the collection.\n\n`;
      header += "As per our new workflow, the dataset will also be listed on Infoscience by our staff. The record will be submitted for approval to your laboratory, similar to the process followed by publications imported from the Web of Science.\n\n"
      header += "XXX CHECK IF APPLICABLE XXX "
      header += "Furthermore, considering that the dataset is linked to a publication, we will also archive a copy of the dataset for long-time preservation in EPFL's ACOUA platform (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info).\n"
      header += "\n\n"
      header += "If you have any question about these steps, do not hesitate to ask!\n"

    } else {
      header += `Good XXX,\n\nYou are designated as EPFL creators for \"${title}\" (${identifier}), which has been submitted to the EPFL Community on Zenodo.`;
      header += "We thank you and your coworkers for this contribution.\n\n"
      header += "Within our curation procedure ( https://zenodo.org/communities/epfl/about/ ), we have identified a few details that could be improved:\n\n";

      footer += "When the above feedback is addressed, we will be able to add value to your results and potentially save some of your time:\n";
      footer += "    •   we create Infoscience records for datasets newly accepted into the EPFL community, so that they are available for web pages, activity reports, etc.\n";
      footer += "    •   if the upload is related with a publication and if the distribution license allows it, we can take advantage of this situation to copy the data into EPFL's long time archive ACOUA (dedicated to safekeeping, not distribution of the data, the access to that platform is not public; see https://www.epfl.ch/campus/library/services-researchers/acoua-long-term-preservation/ for more info) without any administrative burden for the authors.\n";
      footer += "Please note that we cannot keep a case open for an indefinite time: we need your input regarding the possible delays."
      footer += " If our messages are left unanswered for too long, we will process the submission according its current state."
      footer += " If you would like us to re-open the case after an update on your side, just let us know and we will be happy to do so."
      footer += "\n\nIf you have any questions or comments about this service, do not hesitate to ask. We will be glad to answer or receive your feedback.\n\n"
    }
    footer += "Best regards,\nZZZZZZ"

    text = header + text + footer;
    let finalURL = "mailto:" + emailTo + '?&subject=' + emailSub + '&body=' + encodeURIComponent(text);
    // console.log(finalURL);
    openMailEditor(finalURL);
  })



  var menu = document.getElementsByClassName("sixteen wide tablet five wide computer column sidebar")[0];
  console.log(menu);
  var metadata = document.getElementById("metrics");

  //menu.appendChild(btn);

  menu.insertBefore(frm, metadata);

  let mainTitle = $("h1");
  let authorList = $('section#creatibutors');
  if (authorList.length) {
    addCheckElement(authorList, "M1", "after", true);
  }


  let contentChecks = $('<div>');
  let contentElement = $("div#files-list-accordion-trigger");
  console.log('files heading?', contentElement);
  if (contentElement.length == 0) {
    contentElement = $("div#files-list-accordion-trigger");
    console.log('contentElement:', contentElement);
  }
  addCheckElement(contentChecks, "M2", "after", true);

  let abstract = $("section#description");
  if (abstract.length) {
    addCheckElement(abstract, "M3", "before", true);
    abstract.prepend($('<div>----------------------------------------------------------------------------------------------------------------------------------</div>'));
  }

  if (authorList.length) {
    addCheckElement(authorList, "M4", "after", true);
    addCheckElement(authorList, "R1", "after", true);


  }

  if (contentElement.length) {
    addCheckElement(contentChecks, "R4", "after", true);
    addCheckElement(contentChecks, "R5", "after", true);
  }

  if (mainTitle.length) {
    addCheckElement(mainTitle, "R2", "after", true);
  }

  // This one should always be there, let's use it as a reference point
  // TODO still buggy, the green checkbox element is missing when using the importantFrame fallback

  let importantFrame = $("section#metrics");

  let license = $("div#licenses");
  if (license.length) {
    addCheckElement(license, "N3", "after", true);
  } else {
    addCheckElement(importantFrame, "N3", "after", false);
  }

  let relativeIdentifiers = $("div#related-works-accordion-trigger");
  if (relativeIdentifiers.length) {
    addCheckElement(relativeIdentifiers, "R3", "after", true);
  } else {
    addCheckElement(importantFrame, "R3", "after", false);
  }

  let grants = $("h3:contains('Funding')");
  if (grants.length) {
    addCheckElement(grants, "N1", "after", true);
  } else {
    addCheckElement(importantFrame, "N1", "after", false);
  }

  if (contentElement.length) {
    addCheckElement(contentChecks, "N2", "after", true);
    addCheckElement(contentChecks, "N4", "after", true);
  }

  let thesisUniversity = $("dt:contains('Awarding university')");
  if (thesisUniversity.length) {
    addCheckElement(thesisUniversity, "N5", "after", true);
  } else {
    addCheckElement(importantFrame, "N5", "after", false);
  }

  if (contentElement.length) {
    addCheckElement(contentChecks, "N6", "after", true);
    let referencesWarning = '<div><b>Do not forget to check the references box at the bottom of the page...</b></div>';
    contentChecks.append(referencesWarning);
  }

  let referencesElement = $("div#references-accordion-trigger");
  if (referencesElement.length) {
    addCheckElement(referencesElement, "N7", "after", true);
  } else {
    referencesElement = $("div#references-accordion-trigger");
    addCheckElement(referencesElement, "N7", "before", false);
  }

  let keywords = $("h2:contains('Keywords and subjects')");
  if (keywords.length) {
    addCheckElement(keywords, "N8", "after", true);
  } else {
    addCheckElement(importantFrame, "N8", "after", false);
  }

  contentElement.prepend(contentChecks);

  $('div.btn-group label.btn').on("click", function myclick(event) {
    console.log('click detected');
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
  location.href = url;
}


function policyCheck(checkCode) {
  if (checkCode == 'M1') {
    let epflCreators = 0;
    for (let creator of recordJson.data.attributes.creators) {
      for (let affiliation of creator.affiliation) {
        if (affiliation.includes('EPFL')) {
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

  if (checkCode == 'M2') {
    let noAccess = $('div.panel-body:contains("Files are not publicly accessible.")');
    let embargoAccess = $('div.panel-body:contains("Files are currently under embargo")');
    if (noAccess.length || embargoAccess.length) {
      return 'bad';
    } else {
      // we might have password-protected files - be careful
      return 'maybe';
    }
  }

  if (checkCode == 'M4') {
    let orcidEpflCreators = 0;
    for (let creator of recordJson.data.attributes.creators) {
      for (let affiliation of creator.affiliation) {
        if (affiliation.includes('EPFL')) {
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

  if (checkCode == 'R4') {
    let readmeFound = 'neutral';
    $('a.filename').each(function() {
      let f = $(this).text().toLowerCase();
      console.log([f], f.indexOf('readme'));
      if ((f.indexOf('readme') >= 0) && (f.indexOf('readme') < 4)) {
        console.log('should be OK');
        return readmeFound = 'ok';
      }
    });
    return readmeFound;
  }


  if (checkCode == 'N3') {
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

  if (checkCode == 'N5') {
    if ($("dt:contains('Awarding University:')").length) {
      if ($("h5:contains('Thesis supervisor(s)')").nextAll('p').html().match(/<span/g).length) {
        return 'ok';
      }
    }

  }

  if (checkCode == 'N8') {
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
    } catch {}

  }

  // Default value if nothing else was noticed
  return 'neutral';

}