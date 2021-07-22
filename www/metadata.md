---
layout: single
title: Metadata
permalink: /metadata/
---
The SDG metadata are currently available in the languages below. The source for SDG metadata translations is the SDG Data Lab, which is managed by UNSD. The SDG Data Lab contains SDG metadata in English as approved by the IAEG-SDGs. 

Prior to August, 2021, source SDG metadata files were converted into machine-readable form by the World Bank translation team in collaboration with UNSD. Beginning in Spring, 2021, source SDG metadata are converted into machine-readable form by UNSD. The World Bank translation team will then harvest these files from the SDG Data Lab. This will include both updated tier 1 metadata files, and all tier 2 metadata files. This change in process supports quality control and efficiencies in timeliness of updated translations.

The translation status for each language (except the English source files) appears below.

For more information on the translation process, please see [Documentation]({{ site.baseurl }}/documentation/).

<ul>
  {% for language in site.data.languages %}
  {% assign langcode = language[0] | trim %}
  {% if site.data.store.metadata[langcode] %}
  <li>
    <a class="btn btn--info" href="{{ site.baseurl }}/metadata/{{ language[0] }}">
      {{ language[1].name }}
    </a>
    {% if langcode != 'en' %}
    <a href="https://hosted.weblate.org/engage/sdg-metadata/{{ language[0] }}/">
      <img src="https://hosted.weblate.org/widgets/sdg-metadata/{{ language[0] }}/svg-badge.svg" alt="Translation status" />
    </a>
    {% endif %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
