#!/bin/sh

export DOWNLOAD=`gh api   -H "Accept: application/vnd.github+json"   -H "X-GitHub-Api-Version: 2022-11-28"   /repos/epfllibrary/curation_checklist/releases/latest | jq -r ".assets.[0].browser_download_url"` 
export FILENAME=`gh api   -H "Accept: application/vnd.github+json"   -H "X-GitHub-Api-Version: 2022-11-28"   /repos/epfllibrary/curation_checklist/releases/latest | jq -r ".assets.[0].name"`

wget $DOWNLOAD -O $FILENAME && mv $FILENAME /Volumes/communsisb\$/commun/H_Donnees_Recherche/H2_Procedures/Zenodo_EPFL_Community/
