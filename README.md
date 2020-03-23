# SDG Metadata Translation Pilot

Evaluating machine translation of indicator metadata for the Sustainable Development Goals.

[Find more information on this project](https://opendataenterprise.github.io/sdg-metadata/).

## Requirements

Node.js and Ruby 2.x.

## Local installation

To try it out locally, run:

```
make install
make serve
```

## Adding new source translations from Excel

Convert an Excel file of English metadata into templates for translation:

```
node scripts/excel-to-gettext.js my-excel-file.xlsx
```

* The Excel file must contain one sheet per indicator (named with the indicator ID, such as "1.1.1").
* Each sheet must contain an `ID` column and a `VALUE` column.

## Adding a new language

1. Add new .po files in a new language folder under the `translations` folder. (This will typically be done via a CAT platform like Weblate.)
2. Add an entry in [this file](https://github.com/OpenDataEnterprise/sdg-metadata/blob/master/www/_data/languages.yml) for the new language.
