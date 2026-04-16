import datacite_check
import pandas
import time

infile = '/Users/borel/temp/OpenAlexDatasetsEPFL(OpenAlexDatasetsEPFL).csv'

data = pandas.read_csv(infile, delimiter=';', encoding='utf-8')

checks = [x for x in datacite_check.checklistData if x not in datacite_check.too_zenodo_specific]

print('\t'.join(['doi'] + checks))

for doi in data['doi']:
    current_object = datacite_check.CandidateObject(doi=doi)
    print('\t'.join([doi] + [current_object.policy_check(x) for x in checks]))
    time.sleep(1)
