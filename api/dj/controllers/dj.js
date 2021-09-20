'use strict'

const { parseMultipartData, sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')

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
          data.user = ctx.state.user.id
          entity = await strapi.services.dj.create(data, { files })
        } else {
          ctx.request.body.user = ctx.state.user.id
          entity = await strapi.services.dj.create(ctx.request.body)
        }
        return sanitizeEntity(entity, { model: strapi.models.dj })
      },
  /**
   * Update a record.
   *
   * @return {Object}
   */

  async update(ctx) {
    const { id } = ctx.params
    let entity

    const [dj] = await strapi.services.dj.find({
      id: ctx.params.id,
      'user.id': ctx.state.user.id,
    })

    if (!dj) {
      return ctx.unauthorized(`You can't update this entry`)
    }

    if (ctx.is('multipart')) {
      const { data, files } = parseMultipartData(ctx)

      // Remove current photo from media if new is being uploaded or current one discarded
      if(dj.photo && (!_.isEmpty(files) || data.photo === null)) {
        await strapi.plugins.upload.services.upload.remove(dj.photo)
      }
      // Line that ensures that user reference stays correct - disabled for now
      // data.user = ctx.state.user.id

      entity = await strapi.services.dj.update({ id }, data, {
        files,
      })
    } else {
      entity = await strapi.services.dj.update({ id }, ctx.request.body)
    }

    return sanitizeEntity(entity, { model: strapi.models.dj })
  },

    /**
     * Delete a record.
     *
     * @return {Object}
     */
  
    async delete(ctx) {
      const { id } = ctx.params;
  
      const [dj] = await strapi.services.dj.find({
        id: ctx.params.id,
        'user.id': ctx.state.user.id,
      })

      if (!dj) {
        return ctx.unauthorized(`You can't update this entry`)
      }

      // Remove DJ photo from uploads
      if(dj.photo) {
        await strapi.plugins.upload.services.upload.remove(dj.photo)
      }

      const entity = await strapi.services.dj.delete({ id });
      return sanitizeEntity(entity, { model: strapi.models.dj });
    },
}

