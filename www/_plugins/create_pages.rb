require "jekyll"

module SdgMetadataPlugins
  class CreatePages < Jekyll::Generator
    safe true
    priority :normal

    def get_field_content(content, field_id, field_name, site, language)
      prefix = '<div id="' + field_id + '">'
      if content == nil
        content = ''
      end
      inner = '<p class="concept-name">' + translate_concept_name(site, field_id, language) + '</p>' + content
      if content == '' || content == nil
        inner = '<p>' + field_name + ' (' + field_id + ') is not yet translated.</p>'
      end
      suffix = '</div>'
      return prefix + inner + suffix
    end

    def is_single_letter(character)
      return character.length == 1 && !/\A\d+\z/.match(character)
    end

    # Make any goal/target/indicator number suitable for use in sorting.
    def get_sort_order(number)
      if number.is_a? Numeric
        number = number.to_s
      end

      # We'll mainly rely on Gem::Version.new(), but we want to make
      # sure that single-letter parts (like the "b" in 2.b) appear
      # after all the numeric parts. Ie, 2.b should be after 2.7.
      parts = number.split('-')
      if parts.size > 1
        if is_single_letter(parts[parts.size - 1])
          parts[parts.size - 1] = '9999' + parts[parts.size - 1]
        end
      end

      # Now we can rely on Gem::Version.new().
      number = parts.join('.')
      Gem::Version.new(number)
    end

    # Get a miscellaneous translation.
    def translate_site_text(site, key, language)
      if site.data['store']['t'][language].key?('site')
        if site.data['store']['t'][language]['site'].key?(key)
          if site.data['store']['t'][language]['site'][key] != ''
            return site.data['store']['t'][language]['site'][key]
          else
            return site.data['store']['t']['en']['site'][key]
          end
        end
      end
      return key
    end

    def translate_concept_name(site, key, language)
      if site.data['store']['t'][language].key?('concepts')
        if site.data['store']['t'][language]['concepts'].key?(key)
          if site.data['store']['t'][language]['concepts'][key] != ''
            return site.data['store']['t'][language]['concepts'][key]
          else
            return site.data['store']['t']['en']['concepts'][key]
          end
        end
      end
      return key
    end

    def generate(site)
      base = site.source

      # Compile all the goals and targets.
      goals_by_language = {}
      targets_by_language = {}
      site.data['store']['metadata'].each do |language, indicators|
        goals_by_language[language] = {}
        targets_by_language[language] = {}
        indicators.each do |indicator, field_content|
          parts = indicator.split('-')
          goal = parts[0]
          target = parts[0] + '-' + parts[1]
          if !goals_by_language[language].has_key?(goal)
            goals_by_language[language][goal] = []
          end
          if !targets_by_language[language].has_key?(goal)
            targets_by_language[language][goal] = {}
          end
          if !targets_by_language[language][goal].has_key?(target)
            targets_by_language[language][goal][target] = []
          end
          goals_by_language[language][goal].append(indicator)
          targets_by_language[language][goal][target].append(indicator)
        end
      end

      # Generate all the goal pages.
      goals_by_language.each do |language, goals|
        goals.each do |goal, indicators|
          dir = File.join('metadata', language, goal) + '/'
          layout = 'goal'
          title = translate_site_text(site, 'Goal %number', language)
          language_name = language
          if site.data['languages'].key?(language)
            language_name = site.data['languages'][language]['name']
          end
          title = title.gsub('%number', goal) + ' - ' + language_name
          data = {
            'slug' => goal,
            'indicators' => indicators.uniq.sort_by { |k| get_sort_order(k) },
            'targets' => targets_by_language[language][goal].keys.uniq.sort_by { |k| get_sort_order(k) },
          }
          content = ''

          site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
        end
      end

      # Generate all the target pages.
      targets_by_language.each do |language, goals|
        goals.each do |goal, targets|
          targets.each do |target, indicators|
            dir = File.join('metadata', language, target) + '/'
            layout = 'target'
            title = translate_site_text(site, 'Target %number', language)
            language_name = language
            if site.data['languages'].key?(language)
              language_name = site.data['languages'][language]['name']
            end
            title = title.gsub('%number', target.gsub('-', '.')) + ' - ' + language_name
            data = {
              'slug' => goal,
              'indicators' => indicators.uniq.sort_by { |k| get_sort_order(k) },
            }
            content = ''

            site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
          end
        end
      end

      # Generate all the indicator pages.
      site.data['store']['metadata'].each do |language, indicators|
        indicators.each do |indicator, field_content|
          dir = File.join('metadata', language, indicator) + '/'
          layout = 'indicator'
          indicator_number = indicator.gsub('-', '.')
          title = translate_site_text(site, 'INDICATOR_NUMBER', language)
          title = title.gsub('%number', indicator_number)
          data = {'slug' => indicator}

          # For now let's only display translated fields.
          translated_fields = site.data['store']['fields'].select {|c| field_content[c['id']] != '' }

          toc = translated_fields.map do |c|
            # Look for a translated name.
            translated_name = site.data['store']['t'][language]['concepts'][c['id']]
            if translated_name == '' || translated_name == nil
              # But fall back to English.
              translated_name = c['name']
            end
            '<li><a href="#' + c['id'] + '">' + translated_name + '</a></li>'
          end
          toc = '<ul class="indicator-fields">' + toc.join('') + '</ul>'

          content = translated_fields.map {|c| '<a name="' + c['id'] + '"></a>' + get_field_content(field_content[c['id']], c['id'], c['name'], site, language) }
          content = content.join("")

          # This provides some data for the benefit of the Minimal Mistakes theme.
          data['sidebar'] = [
            {
              'title' => translate_site_text(site, 'SMDX_METADATA_CONCEPTS', language),
              'text' => toc
            }
          ]

          site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
        end
      end

      # Generate all the language pages.
      site.data['store']['metadata'].each do |language, indicators|
        dir = File.join('metadata', language) + '/'
        layout = 'language'
        title = 'Language: ' + language
        if site.data['languages'].key?(language)
          title = 'Language: ' + site.data['languages'][language]['name']
        end
        content = ''
        language = language
        data = {
          'goals' => goals_by_language[language].keys.uniq.sort_by { |k| get_sort_order(k) }
        }
        site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
      end

      # Generate the full-metadata-per-language pages.
      site.data['store']['metadata'].each do |language, indicators|
        indicators_sorted = indicators.keys.sort_by{ |k| get_sort_order(k) }
        dir = File.join('metadata', language, 'all') + '/'
        layout = 'full-metadata-per-language'
        title = 'All metadata for: ' + language
        if site.data['languages'].key?(language)
          title = 'All metadata for: ' + site.data['languages'][language]['name']
        end
        content = ''
        data = { 'indicators' => [] }
        toc = indicators_sorted.map do |indicator|
          label = indicator.gsub('-', '.')
          '<li><a href="#' + indicator + '">' + label + '</a></li>'
        end
        toc = '<ul class="indicator-fields">' + toc.join('') + '</ul>'
        data['sidebar'] = [
          {
            'title' => 'Indicators',
            'text' => toc
          }
        ]
        indicators_sorted.each do |indicator|
          field_content = indicators[indicator]
          translated_fields = site.data['store']['fields'].select {|c| field_content[c['id']] != '' }
          content = translated_fields.map {|c| '<a name="' + indicator + '-' + c['id'] + '"></a>' + get_field_content(field_content[c['id']], c['id'], c['name'], site, language) }
          content = content.join("")
          data['indicators'].push({
            'indicator_id' => indicator,
            'indicator_label' => indicator.gsub('-', '.'),
            'content' => content,
          })
        end
        site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
      end

      # Generate all the statistics pages.
      site.data['store']['metadata'].each do |language, indicators|
        dir = File.join('metadata', language, 'statistics') + '/'
        layout = 'statistics'
        title = 'Translation statistics: ' + language
        if site.data['languages'].key?(language)
          title = 'Translations statistics: ' + site.data['languages'][language]['name']
        end
        content = ''
        language = language
        data = {}
        site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
      end
    end
  end

  # A Page subclass used in the `CreatePages` class.
  class SdgMetadataPage < Jekyll::Page
    def initialize(site, base, dir, layout, title, content, language, data)
      @site = site
      @base = base
      @dir = dir
      @name = 'index.html'

      self.process(@name)
      self.data = {}
      self.data['layout'] = layout
      self.data['title'] = title
      self.data['language'] = language
      self.data['classes'] = 'language-' + language
      self.data.merge!(data)
      self.content = content
    end
  end
end
