import re
import string

import pyo3_runtime
import requests

from datahugger import DOIResolver, resolve, FileEntry, DirEntry
from langdetect import detect_langs

too_zenodo_specific = ['supervisorIfThesis']

checklistData = {
  'epflAuthor': {
    'full': 'At least one author must be affiliated with EPFL at the time of the submission or creation of the submitted work',
    'short': '<i>EPFL authors?&nbsp;</i>',
    'answers': {
      'bad': 'There is not enough evidence that the authors are or were affiliated with EPFL, we would be grateful for more details (for example an e-mail address or ORCID identifier)',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': '[Typical issue, please check!] One or more authors are affiliated with EPFL, which is sufficient for us, ' +
                'but the format does not conform to the standard address format "École polytechnique fédérale de Lausanne (EPFL)" ' + 
                '(part of the Directive concerning research integrity and good scientific practice at EPFL - LEX 3.3.2).' +
                '\nIn the Zenodo entry form, the compliant suggestion by the entry form is the one listed with "Source: ROR (Prefered)".',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'wrapper': 'div'
  },
  'epflContact': {
    'full': 'Contact information for at least one EPFL author is provided, preferably through an ORCID identifier',
    'answers': {
      'bad': 'Minimal contact information for an EPFL author must be available, please add it either using ORCID or in the Description.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<i>ORCID or email for 1 EPFL author?&nbsp;</i>',
    'wrapper': 'div'
  },
  'accessForReview': {
    'full': 'The content of the submitted work must be accessible for review, i.e. Open Access, or Restricted after an access request has been granted to the reviewers. Embargoed works will be reviewed after the embargo expires',
    'answers': {
      'bad': 'If we cannot access the content of the dataset, we cannot check its compliance with our curation criteria. Would it be possible to make it at least Restricted?',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<i>Access to content?&nbsp;</i>',
    'wrapper': 'div'
  },
  'sufficientDescription': {
    'full': 'The Description of the submitted work is sufficiently detailed. Mere references to external articles or to other external resources are not sufficient descriptions',
    'answers': {
      'bad': 'For example, a few sentences explaining how the files were generated or used would be very helpful for a potential user. If the data was used in a publication, you could also include part of the article abstract, to make the scientific context more immediately apparent.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<i>Sufficient abstract?&nbsp;</i>',
    'altshort': '<i>Sufficient abstract?&nbsp;</i>',
    'wrapper': 'div'
  },
  'readmePresent': {
    'full': 'The submitted work includes a clearly identifiable README file, typically in the root directory. This is not required for works consisting in one single document (ex. publication, poster, or presentation)',
    'answers': {
      'bad': 'Such a file really facilitates a potential user\'s understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, it is a requirement for long-term archiving by EPFL\'s ACOUA system (further info at the end of this message).',
      'meh': 'Such a file really facilitates a potential user\'s understanding of your data. A minimal README will be similar to the general description, with the added value of being easier to download together with the rest of the data. Finally, it is a requirement for long-term archiving by EPFL\'s ACOUA system (further info at the end of this message).',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<i>README present?&nbsp;</i>',
    'wrapper': 'span'
  },
  'originalDOI': {
    'full': 'The main DOI has been assigned by Zenodo',
    'answers': {
      'bad': 'Entering an existing DOI as the main identifier is allowed only if the submitted work is an exact copy of a digital object that has already received its DOI on another platform, but even in that case an IsIdenticalTo relationship will be more correct. Typically, supplementary data to a journal article should NOT re-use the journal article DOI.',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'must',
    'short': '<i>&nbsp;Original (Zenodo) DOI?&nbsp;</i>',
    'wrapper': 'span'
  },
  'allORCIDs': {
    'full': 'All authors are identified by their ORCID',
    'answers': {
      'bad': 'By listing all authors with their respective ORCID, you make sure that they can be recognized unambiguously. If an EPFL author has no ORCID yet, we strongly suggest to create one: see https://actu.epfl.ch/news/link-your-orcid-profile-with-epfl/ for more info',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<i>Authors with ORCID?&nbsp;</i>',
    'wrapper': 'div'
  },
  'humanReadableTitle': {
    'full': 'The main title should be human-readable on the same level as conventional publications: filenames or coded expressions are deprecated',
    'answers': {
      'bad': 'As for any scientific output, a good title is the first place where others will learn about the nature and purpose of your research. The same principles as for scientific papers are applicable.',
      'meh': 'It is usually better to distinguish a dataset from the associated publication through their titles. A simple recipe could be "Dataset for " + the article title',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<i>Readable title?&nbsp;</i>',
    'wrapper': 'span'
  },
  'relatedWorks': {
    'full': 'If existing, references to related publications (e.g., article, source code, other datasets, etc.) are specified in the "Related works" field. If available, references are designated by their respective DOIs',
    'answers': {
      'bad': 'The upload appears to be related with a publication. If the final publication or a version of the manuscript is available online, it should be listed it in the "Related/alternate identifiers" section - preferably using a DOI but a URL is fine if no DOI has been assigned to the publication. If no online version exists yet (even a preprint), can you give us an estimated time for the expected publication?',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<i>&nbsp</i>;',
    'wrapper': 'span',
    'altwrapper': 'dt',
    'altshort': '<b>No related identifiers here, is it OK?&nbsp;</b>'
  },
  'listedGrants': {
    'full': 'If related grants require an acknowledgement, they are listed using “Funding/Grants” fields',
    'answers': {
      'bad': 'There are specific fields to list grants, it is better to use them than to write an acknowledgement in the description: it facilitates the automatic retrieval of that information on the funders\' platfoms',
      'meh': 'There is no mention of specific funding, which is fine if the project is operated using EPFL budget only. However, if some funding body (such as the Swiss National Science Foundation, some European program or other) is acknowledged in the publication it should be listed here as well.',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<i>&nbsp;</i>',
    'wrapper': 'span',
    'altshort': '<b>No grants here, is it OK?&nbsp;</b>',
    'altwrapper': 'dt',
    'selector': 'dt:contains("Grants:")'
  },
  'noPersonalData': {
    'full': 'Any sensitive, personal data has been anonymized',
    'answers': {
      'bad': 'The upload contains personal data about human research subjects, which is forbidden by various laws. Make sure the access is strictly limited and/or replace the data with an anonymized version',
      'meh': 'THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG',
      'maybe': 'THIS IS NOT GREY AREA: IF YOU SUSPECT IT IS WRONG, IT IS PROBABLY WRONG',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'recommended',
    'short': '<i>No sensitive data?&nbsp;</i>',
    'wrapper': 'div'
  },
  'cleanDataset': {
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
  'permissiveLicence': {
    'full': 'Permissive licenses are preferred. CC0, CC-BY-4.0, CC-BY-SA-4.0 for data and MIT, BSD, GPL for code are suggested',
    'answers': {
      'bad': 'Limited access and re-usability are against the principles of Open Science endorsed by EPFL. Are you sure you cannot use a more liberal license?',
      'meh': 'The chosen license limits the potential re-use of your data by others. There can be valid reasons for that, but in general we encourage the most open options',
      'maybe': 'An unusual license was chosen for this upload, is there a reason why it was preferred over the better-known options?',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>&nbsp;</i>',
    'wrapper': 'span',
    'altshort': '<b>No license, probably wrong&nbsp;</b>',
    'altwrapper': 'dt'
  },
  'detailedReadme': {
    'full': 'The README file contains detailed information about the work creation (authors, time, place, methodologies…), content (file organization and naming, formats, relevant standards…), sharing and access, etc.',
    'answers': {
      'bad': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/handle/20.500.14299/192546',
      'meh': 'A good README can significantly improve a potential user\'s understanding of your data. Feel free to use our template and guidelines for inspiration: https://infoscience.epfl.ch/handle/20.500.14299/192546',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>Good README?&nbsp;</i> ',
    'wrapper': 'div'
  },
  'supervisorIfThesis': {
    'full': 'If the submission is related to a PhD thesis, the supervisor is specified',
    'answers': {
      'bad': 'There are mentions of a PhD thesis, this should be formally declared using the relevant input field with the supervisor name and institution',
      'meh': 'THIS IS NOT A GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'maybe': 'THIS IS NOT A GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>&nbsp;| Supervisor listed?&nbsp;</i>',
    'wrapper': 'span',
    'altshort': '<b>No thesis indication, probably fine&nbsp;</b>',
    'altwrapper': 'dt'
  },
  'openFileFormats': {
    'full': 'Files are available in open formats. If proprietary formats are present, the work also includes versions of the files converted to open formats, with the least possible loss of information',
    'answers': {
      'bad': 'A potential user is more likely to be able to work with your data if it is available in open formats, since they will less restricted by some specific software choice. You can check our Fast Guide for examples https://infoscience.epfl.ch/record/265349/files/04_Formats_EPFL_Library_RDM_FastGuide.pdf',
      'meh': 'NOT TOTALLY WRONG, BUT STILL...',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>Open file formats?&nbsp;</i> ',
    'wrapper': 'div'
  },
  'listedSourced': {
    'full': 'Where applicable, sources from which the work is derived are specified in the "References" field',
    'answers': {
      'bad': 'It seems that the upload is derived from existing data. In such a case, the source of that data is best acknowledged using structured metadata: the "Related/alternate identifiers" section is generally intended for digitial sources, the "References" section can be used for other sources',
      'meh': 'THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'maybe': 'THIS IS NOT GREY AREA: IF YOU HAVE SOLID EVIDENCE THAT IT IS WRONG, IT IS WRONG. OTHERWISE JUST FORGET IT.',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>&nbsp;Relevant sources?&nbsp;</i>',
    'wrapper': 'span',
    'altshort': '<b>No "References" section, is this OK?&nbsp;</b>',
    'altwrapper': 'span'
  },
  'properKeywords': {
    'full': 'Keywords are entered as separated fields in the “Keywords and subjects" field',
    'answers': {
      'bad': 'To maximize the effectiveness of keywords, each concept must be listed a distinct entity: each entity will have its own link that leads to other records tagged with the same concept. This will not work if all keywords are combined as one single text entry.',
      'meh': 'No keywords are listed, you might consider adding some. It will make it easier for potential users to discover the dataset (through search results or links from other datasets with the same keywords), and then to understand its context',
      'maybe': 'NOT COMPLETELY RIGHT, ADD NUANCED COMMENT HERE',
      'neutral': 'OUBLI DANS LA CURATION: A VERIFIER! :-)',
      'ok': ''
    },
    'category': 'nth',
    'short': '<i>&nbsp;</i>',
    'wrapper': 'span',
    'altshort': '<b>No keywords here, is it OK?&nbsp;</b>',
    'altwrapper': 'dt'
  }
}


class CandidateObject:
    metadata = None

    def __init__(self, doi=None):
        self.doi = doi
        self.metadata = self.get_metadata(self.doi)

    def get_metadata(self, doi):
        if self.doi:
            r = requests.get(f"https://api.datacite.org/dois/{doi}")
            datacite_response = r.json()
            if 'data' in datacite_response:
                return datacite_response['data']['attributes']

    def policy_check(self, check_code):
        """
        Automatic checks: will return 'neutral' by default.
        The logic must be adapted to each criterion, not all of them can be automated.

        Args:
            check_code: The check identifier string
        """

        if check_code == 'epflAuthor':
            epfl_creators = 0
            compliant_creators = 0
            for creator in self.metadata.get('creators', []):
                for affiliation in creator.get('affiliation', []):
                    name = affiliation
                    if (
                        'EPFL' in name
                        or re.search(r'[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne', name)
                        or re.search(r'[Ss]wiss [Ff]ederal [Ii]nstitute of [Tt]echnology .{1,4}Lausanne', name)
                    ):
                        epfl_creators += 1
                    if 'École Polytechnique Fédérale de Lausanne' in name:
                        compliant_creators += 1

            if compliant_creators == len(self.metadata['creators']):
                return 'ok'
            if epfl_creators:
                return 'maybe'
            return 'meh'


        if check_code == 'accessForReview':
            accessForReview = 'maybe'
            try:
                doi_resolver = DOIResolver(timeout=30)
                # print([self.metadata['doi']])
                url = doi_resolver.resolve(self.metadata['doi'], True)
                # print(url)
                dataset = resolve(url)
                file_list = list(dataset.crawl())
            except RuntimeError as e:
                # In Zenodo, restricted-access datasets return 403 when listing the files
                if re.search(r'with state code: 403', str(e)):
                    accessForReview = 'meh'
                # Otherwise: don't know what to do yet
                pass
            except BaseException as e:
                # datahugger will fail in some cases, such as Dryad, Figshare...
                print(e)
                pass
            return accessForReview


        if check_code == 'epflContact':
            orcid_epfl_creators = 0
            for creator in self.metadata.get('creators', []):
                for affiliation in creator.get('affiliation', []):
                    name = affiliation
                    if (
                        'EPFL' in name
                        or re.search(r'[Pp]olytechnique [Ff][eé]d[eé]rale de Lausanne', name)
                        or re.search(r'[Ss]wiss [Ff]ederal [Ii]nstitute of [Tt]echnology .{1,4}Lausanne', name)
                    ):
                        for identifier in creator.get('nameIdentifiers', {}):
                            if identifier.get('nameIdentifierScheme', '').lower() == 'orcid':
                                orcid_epfl_creators += 1

            if orcid_epfl_creators:
                return 'ok'
            descriptions = self.metadata.get('descriptions', [])
            for description in descriptions:
                if '@epfl.ch' in description:
                    return 'maybe'
            return 'bad'

        if check_code == 'sufficientDescription':
            if 'descriptions' in self.metadata:
                return 'maybe'
            else:
                return 'bad'

        if check_code == 'readmePresent':
            readme_found = 'neutral'
            try:
                doi_resolver = DOIResolver(timeout=30)
                # print([self.metadata['doi']])
                url = doi_resolver.resolve(self.metadata['doi'], True)
                # print(url)
                dataset = resolve(url)

                for entry in dataset.crawl():
                    if isinstance(entry, FileEntry):
                        filename = entry.path_crawl_rel.name
                        if re.match(r'readme(\.txt|\.md)?', filename, re.IGNORECASE):
                            readme_found = 'ok'
            except BaseException as e:
                # datahugger will fail in some cases, such as Dryad, Figshare...
                print(e)
                pass
            return readme_found

        if check_code == 'originalDOI':
            allowed_prefixes = [r'10\.15151',
                                r'10\.1594',
                                r'10\.16904',
                                r'10\.17632',
                                r'10\.18167',
                                r'10\.22000',
                                r'10\.24435',
                                r'10\.34777',
                                r'10\.5061',
                                r'10\.5281',
                                r'10\.58119',
                                r'10\.6084',
                                r'10\.7910',
                                ]
            for prefix in allowed_prefixes:
                if re.match(prefix, self.metadata['doi']):
                    return 'ok'
            return 'bad'

        if check_code == 'permissiveLicence':
            # TODO add more synonyms
            good_licenses = ['cc0-1.0', 'cc-by-4.0', 'cc-by-sa-4.0', 'mit', 'bsd-3-clause', 'gpl', 'cc-by', 'cc0', 'cc-by-sa', 'cc by', 'cc by sa']
            if 'rightsList' in self.metadata:
                if len(self.metadata['rightsList']):
                    if 'rightsIdentifier' in self.metadata['rightsList'][0]:
                        license_id = self.metadata['rightsList'][0]['rightsIdentifier'].lower()
                        if license_id in good_licenses:
                            return 'ok'
                else:
                    return 'bad'
            else:
                return 'bad'

        if check_code == 'properKeywords':
            if 'subjects' in self.metadata:
                kw = self.metadata['subjects']
                if len(kw) == 0:
                    return 'meh'
                if len(kw) == 1:
                    if 'scheme' not in kw[0]:
                        if ',' in kw[0]['subject']:
                            return 'bad'
                        if ';' in kw[0]['subject']:
                            return 'bad'
                        if len(kw[0]['subject'].split()) > 3:
                            return 'meh'
                if len(kw) > 1:
                    return 'ok'

        if check_code == 'allORCIDs':
            # Check for ORCID iDs
            # At least one creator with ORCID = maybe. All creators = OK
            orcid_creators = 0
            for creator in self.metadata.get('creators', []):
                if 'nameIdentifiers' in creator:
                    for identifier in creator['nameIdentifiers']:
                        if identifier.get('nameIdentifierScheme', '').lower() == 'orcid':
                            orcid_creators += 1

            if orcid_creators == len(self.metadata.get('creators', [])):
                return 'ok'
            if orcid_creators:
                return 'maybe'
            else:
                return 'bad'

        if check_code == 'relatedWorks':
            # Check for related identifier (experimental)
            # At least one related identifier = green light
            if 'relatedIdentifiers' in self.metadata:
                for related_resource in self.metadata['relatedIdentifiers']:
                    if related_resource.get('relationType', '') == 'IsSupplementTo':
                        return 'ok'
                return 'maybe'
            else:
                # In the absence of any related identifier, a DOI in the description is suspicious.
                # Unless it is the object's DOI itself => negative lookahead needed
                if doi:
                    doi_after_ten = doi[3:]
                    escaped = re.escape(doi_after_ten)
                    pattern = rf'doi\.org\/10\.(?!{escaped})'
                    if 'description' in self.metadata:
                        if re.search(pattern, self.metadata['description']):
                            return 'meh'

        if check_code == 'humanReadableTitle':
            if 'titles' in self.metadata:
                if len(self.metadata['titles']):
                    main_title = self.metadata['titles'][0]['title']
                    words = [''.join([c for c in w if not c in string.punctuation]) for w in main_title.split()]
                    if len(words) < 2:
                        return 'bad'
                    if len(words) < 4:
                        return 'meh'
                    if len(words) > 4:
                        return 'maybe'

        return 'neutral'


if __name__ == "__main__":
    doi = ''
    example_object = CandidateObject(doi='10.5281/zenodo.5730294')
    print(example_object.metadata.keys())

    # check_code = 'epflAuthor'
    # print(example_object.policy_check(check_code))

    for check_code in checklistData:
        print(f'*{check_code}*')
        print(check_code, example_object.policy_check(check_code), checklistData[check_code]['answers'][example_object.policy_check(check_code)])
