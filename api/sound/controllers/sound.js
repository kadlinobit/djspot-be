'use strict';

const { parseMultipartData, sanitizeEntity } = require('strapi-utils')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
      /**
   * Create a record.
   *
   * @return {Object}
   */
       async create(ctx) {
        let entity

        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx)

            const [dj] = await strapi.services.dj.find({ 
                id: data.dj,
                'user.id': ctx.state.user.id
            })

            if (!dj) {
                return ctx.unauthorized(`You can't add sound for this DJ.`)
            }
            entity = await strapi.services.sound.create(data, { files })
        } else {

            const [dj] = await strapi.services.dj.find({ 
                id: ctx.request.body.dj,
                'user.id': ctx.state.user.id
            })

            if (!dj) {
                return ctx.unauthorized(`You can't add sound for this DJ.`)
            }
            entity = await strapi.services.sound.create(ctx.request.body)
        }
        return sanitizeEntity(entity, { model: strapi.models.sound })
      },
};
