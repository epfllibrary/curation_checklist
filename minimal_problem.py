from datahugger import DOIResolver, resolve, FileEntry

doi_resolver = DOIResolver(timeout=30)

url = doi_resolver.resolve('10.17632/h8fmc8w45s.1', True)

print(url)

dataset = resolve(url)

for entry in dataset.crawl():
    if isinstance(entry, FileEntry):
        filename = entry.path_crawl_rel.name
        print(filename)
                        