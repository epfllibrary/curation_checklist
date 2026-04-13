import datacite_check
import pandas
import time

infile = '/Users/borel/temp/OpenAlexDatasetsEPFL(OpenAlexDatasetsEPFL).csv'

data = pandas.read_csv(infile, delimiter=';', encoding='utf-8')

for doi in data['doi']:
	current_object = datacite_check.CandidateObject(doi=doi)
	print(doi, [(x, current_object.policy_check(x)) for x in datacite_check.checklistData])
	time.sleep(1)
