install:
	npm install
	cd www && bundle install

build:
	node scripts/prepare-build.js && cd www && bundle exec jekyll build

serve:
	node scripts/prepare-build.js && cd www && bundle exec jekyll serve
