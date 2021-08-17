'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils');

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    async create(ctx) {
        console.log(ctx)
        let entity;
        if (ctx.is('multipart')) {
          const { data, files } = parseMultipartData(ctx);
          data.user = ctx.state.user.id;
          entity = await strapi.services.dj.create(data, { files });
        } else {
          ctx.request.body.user = ctx.state.user.id;
          entity = await strapi.services.dj.create(ctx.request.body);
        }
        return sanitizeEntity(entity, { model: strapi.models.dj });
      },
};
