---
layout: single
title: Metadata
permalink: /metadata/
---
The SDG metadata are currently available in the languages below. As more translations become available, they will be posted here. For information on the selection of indicators, the conversion, and translation process, please see Documentation.

<ul>
  {% for language in site.data.store.metadata %}
  <li>
    <a class="btn btn--info" href="{{ site.baseurl }}/metadata/{{ language[0] }}">
      {{ site.data.languages[language[0]].name }}
    </a>
  </li>
  {% endfor %}
</ul>
