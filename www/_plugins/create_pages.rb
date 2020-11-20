require "jekyll"

module SdgMetadataPlugins
  class CreatePages < Jekyll::Generator
    safe true
    priority :normal

    def get_field_content(content, field_id, field_name)
      prefix = '<div id="' + field_id + '">'
      inner = content
      if content == '' || content == nil
        inner = '<p>' + field_name + ' (' + field_id + ') is not yet translated.</p>'
      end
      suffix = '</div>'
      return prefix + inner + suffix
    end

    # Make any goal/target/indicator number suitable for use in sorting.
    def get_sort_order(number)
      if number.is_a? Numeric
        number = number.to_s
      end
      sort_order = ''
      parts = number.split('-')
      parts.each do |part|
        if part.length == 1
          part = '0' + part
        end
        sort_order += part
      end
      sort_order
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

    def generate(site)
      base = site.source

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
            if translated_name == ''
              # But fall back to English.
              translated_name = c['name']
            end
            '<li><a href="#' + c['id'] + '">' + translated_name + '</a></li>'
          end
          toc = '<ul class="indicator-fields">' + toc.join('') + '</ul>'

          content = translated_fields.map {|c| '<a name="' + c['id'] + '"></a>' + get_field_content(field_content[c['id']], c['id'], c['name']) }
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
        data = {'indicators' => indicators.keys.sort_by { |k| get_sort_order(k) }}
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
      self.data.merge!(data)
      self.content = content
    end
  end
end
