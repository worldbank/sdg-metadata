require "jekyll"

module SdgMetadataPlugins
  class CreatePages < Jekyll::Generator
    safe true
    priority :normal

    def generate(site)
      base = site.source

      # Generate all the indicator pages.
      site.data['all']['data'].each do |language, indicators|
        indicators.each do |indicator, indicator_fields|
          dir = File.join('metadata', language, indicator) + '/'
          layout = 'indicator'
          title = 'Indicator: ' + indicator
          content = indicator_fields['full']
          data = {'slug' => indicator}
          site.pages << SdgMetadataPage.new(site, base, dir, layout, title, content, language, data)
        end
      end

      # Generate all the language pages.
      site.data['all']['data'].each do |language, indicators|
        dir = File.join('metadata', language) + '/'
        layout = 'language'
        title = 'Language: ' + site.config['languages'][language]
        content = ''
        language = language
        data = {'indicators' => indicators.keys}
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
