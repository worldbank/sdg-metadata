.PHONY: test

install:
	npm install
	cd www && bundle install

build.documents:
	node scripts/build-documents.js

build.api:
	node scripts/build-api.js

build.site:
	node scripts/build-jekyll-data.js
	cd www && bundle exec jekyll build

build: build.documents build.api build.site

serve: build
	cd www && bundle exec jekyll serve --skip-initial-build

serve.site: build.site
	cd www && bundle exec jekyll serve --skip-initial-build

test:
	npm test