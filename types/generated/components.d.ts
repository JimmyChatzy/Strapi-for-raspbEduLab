import type { Schema, Struct } from '@strapi/strapi';

export interface ScenarioScenarioField extends Struct.ComponentSchema {
  collectionName: 'components_scenario_scenario_fields';
  info: {
    description: 'Configuration for a single field on the Create Scenario form';
    displayName: 'Scenario Field';
    icon: 'layout';
  };
  attributes: {
    accept: Schema.Attribute.String;
    category: Schema.Attribute.Relation<'oneToOne', 'api::tab.tab'>;
    defaultValue: Schema.Attribute.String;
    label: Schema.Attribute.String & Schema.Attribute.Required;
    max: Schema.Attribute.Integer;
    min: Schema.Attribute.Integer;
    minHeight: Schema.Attribute.String;
    multiple: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    name: Schema.Attribute.String & Schema.Attribute.Required;
    options: Schema.Attribute.JSON;
    placeholder: Schema.Attribute.String;
    required: Schema.Attribute.Boolean & Schema.Attribute.DefaultTo<false>;
    step: Schema.Attribute.Integer;
    tab: Schema.Attribute.Enumeration<
      ['basic', 'teaching', 'media', 'assign']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'basic'>;
    type: Schema.Attribute.Enumeration<
      ['text', 'textarea', 'richText', 'select', 'number', 'url', 'file']
    > &
      Schema.Attribute.Required &
      Schema.Attribute.DefaultTo<'text'>;
  };
}

export interface SharedMedia extends Struct.ComponentSchema {
  collectionName: 'components_shared_media';
  info: {
    displayName: 'Media';
    icon: 'file-video';
  };
  attributes: {
    file: Schema.Attribute.Media<'images' | 'files' | 'videos'>;
  };
}

export interface SharedQuote extends Struct.ComponentSchema {
  collectionName: 'components_shared_quotes';
  info: {
    displayName: 'Quote';
    icon: 'indent';
  };
  attributes: {
    body: Schema.Attribute.Text;
    title: Schema.Attribute.String;
  };
}

export interface SharedRichText extends Struct.ComponentSchema {
  collectionName: 'components_shared_rich_texts';
  info: {
    description: '';
    displayName: 'Rich text';
    icon: 'align-justify';
  };
  attributes: {
    body: Schema.Attribute.RichText;
  };
}

export interface SharedSeo extends Struct.ComponentSchema {
  collectionName: 'components_shared_seos';
  info: {
    description: '';
    displayName: 'Seo';
    icon: 'allergies';
    name: 'Seo';
  };
  attributes: {
    metaDescription: Schema.Attribute.Text & Schema.Attribute.Required;
    metaTitle: Schema.Attribute.String & Schema.Attribute.Required;
    shareImage: Schema.Attribute.Media<'images'>;
  };
}

export interface SharedSlider extends Struct.ComponentSchema {
  collectionName: 'components_shared_sliders';
  info: {
    description: '';
    displayName: 'Slider';
    icon: 'address-book';
  };
  attributes: {
    files: Schema.Attribute.Media<'images', true>;
  };
}

export interface TabTab extends Struct.ComponentSchema {
  collectionName: 'components_tab_tabs';
  info: {
    displayName: 'Tab';
    icon: 'alien';
  };
  attributes: {
    fields: Schema.Attribute.JSON;
    label: Schema.Attribute.String;
    order: Schema.Attribute.Integer;
  };
}

declare module '@strapi/strapi' {
  export namespace Public {
    export interface ComponentSchemas {
      'scenario.scenario-field': ScenarioScenarioField;
      'shared.media': SharedMedia;
      'shared.quote': SharedQuote;
      'shared.rich-text': SharedRichText;
      'shared.seo': SharedSeo;
      'shared.slider': SharedSlider;
      'tab.tab': TabTab;
    }
  }
}
