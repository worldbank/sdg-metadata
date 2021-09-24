---
layout: single
title: Metadata
permalink: /metadata/
---
The SDG reference metadata are currently available in the languages below. As more translations become available, they will be posted here. For information on the translation process, please see [Documentation]({{ site.baseurl }}/documentation/).

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
    {% else %}
    <span class="language-tag">Source Files for Translation</span>
    {% endif %}
  </li>
  {% endif %}
  {% endfor %}
</ul>
