import _ from 'lodash';

class Helpers {
  constructor(config = {}) {
    this.config = config;

    Object.getOwnPropertyNames(Helpers).forEach((prop) => {
      if (!/(length|name|prototype)/.test(prop)) {
        this[prop] = Helpers[prop];
      }
    });
  }

  static groupEntities(entities, groupSize = Infinity) {
    const grouped = [];

    let group = [];

    entities.forEach((entity) => {
      entity = _.clone(entity);

      if (!entity.groupBefore || group.length >= groupSize) {
        group = [];
      }

      group.push(entity);

      if (!entity.groupAfter || group.length >= groupSize) {
        group.ratio = 0;

        group.forEach((entity) => {
          group.ratio += (entity.thumbnail || entity).ratio;
        });

        group.forEach((entity) => {
          entity.groupRatio = (entity.thumbnail || entity).ratio / group.ratio;
        });

        grouped.push(group);
      }
    });

    return grouped;
  }

  thumbnailSrc(thumbnail, settings, cropSlug, cropFallback) {
    if (!thumbnail) {
      return '';
    }

    if (typeof settings === 'string') {
      // Convert settings to object
      settings = _.reduce(settings.split(/,|;/), (settingsObj, setting) => _.merge(settingsObj, _.fromPairs([setting.split(/_|:/)])), {});
    }

    if (cropSlug) {
      const crop = thumbnail.crops ? thumbnail.crops[cropSlug] : null;
      if (crop) {
        settings.x = crop[0];
        settings.y = crop[1];
        settings.x2 = crop[2];
        settings.y2 = crop[3];
      } else if (cropFallback) {
        settings.g = cropFallback;
      }
    }

    // Convert settings to string
    const settingsString = _.map(settings, (value, key) => `${key}:${value}`).join(';');

    if (/(image)/.test(thumbnail.thumbnailType)) {
      if (thumbnail.ext === '.svg' && !settings.f) {
        return `${this.config.assistUrl}/${this.config.slug}/${thumbnail.name + thumbnail.ext}`;
      }

      return `${this.config.assistUrl}/${this.config.slug}/transform/${settingsString}/${thumbnail.name + thumbnail.ext}`;
    }

    if (/(video)/.test(thumbnail.thumbnailType)) {
      return `${this.config.assistUrl}/${this.config.slug}/transform/${settingsString}/${thumbnail.name}/thumb.jpg`;
    }

    if (/(oembed|proxy)/.test(thumbnail.thumbnailType)) {
      const thumbnailUrl = thumbnail.thumbnailUrl.replace(/https?:\/\//, '');

      return `${this.config.assistUrl}/${this.config.slug}/proxy/transform/${settingsString}/${thumbnailUrl}`;
    }

    return '';
  }

  videoSrc(video, settings) {
    if (!video) {
      return '';
    }

    if (typeof settings === 'string') {
      // Convert settings to object
      settings = _.reduce(settings.split(/,|;/), (settingsObj, setting) => _.merge(settingsObj, _.fromPairs([setting.split(/_|:/)])), {});
    }

    // Convert settings to string
    settings = _.map(settings, (value, key) => `${key}:${value}`).join(';');

    return `${this.config.assistUrl}/${this.config.slug}/transform/${settings}/${video.name + video.ext}`;
  }

  thumbnailSrcset(thumbnail, sizes, targetWidth = -1) {
    if (targetWidth > -1) {
      const widths = sizes.map(size => parseInt(Object.keys(size)[0], 10)).sort((a, b) => (a > b ? 1 : -1));
      const width = _.find(widths, width => width >= targetWidth);
      const size = _.find(sizes, size => parseInt(Object.keys(size)[0], 10) === width);
      return this.thumbnailSrc(thumbnail, Object.values(size)[0]);
    }
    return sizes.map(size => `${this.thumbnailSrc(thumbnail, Object.values(size)[0])} ${Object.keys(size)[0]}w`).join(', ');
  }
}

export default Helpers;
