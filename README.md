# SDG Metadata Translation Pilot

Evaluating machine translation of indicator metadata for the Sustainable Development Goals.

[Find more information on this project](https://worldbank.github.io/sdg-metadata/).

## Requirements

Node.js and Ruby 2.x.

## Local installation

To try it out locally, run:

```
make install
make serve
```

## Harvesting the latest English source material

```
git checkout master
git pull origin master
make install
make harvest
git add translations-metadata
git commit -m "HARVEST: YYYY-MM-DD"
git push origin master
```

Note that - if the `make harvest` gives any warnings or outputs, consult with UNSD to resolve them. You may need to tweak the [list of hardcoded indicator IDs](https://github.com/worldbank/sdg-metadata/blob/master/scripts/harvest-indicators.js#L75).
