'use strict'

/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

const { sanitizeEntity } = require('strapi-utils')

module.exports = {
    /**
     * Toggle like record - if exists - delete it, otherwise - create it.
     *
     * @return {Object}
     */

    async toggle(ctx) {
        let entity

        const { user } = ctx.state
        let { sound } = ctx.request.body
        sound = parseInt(sound)

        if (typeof sound !== 'number') {
            ctx.throw(400, 'Only ID can be passed to this request')
        }

        if (ctx.is('multipart')) {
            ctx.throw(400, 'Multipart request not allowed, only make JSON requests')
        }

        // Check if liked sound exists in the DB
        const soundFromDB = await strapi.services.sound.findOne({ id: sound })
        if (!soundFromDB) {
            ctx.throw(400, 'Sound does not exist')
        }

        // Check for existing like
        const existingLike = await strapi.services.like.findOne({
            user: user.id,
            sound
        })

        // Toggle like - if exists, delete. Otherwise, create.
        if (existingLike) {
            entity = await strapi.services.like.delete({ id: existingLike.id })
        } else {
            entity = await strapi.services.like.create({ sound, user })
        }

        return sanitizeEntity(entity, { model: strapi.models.like })
    }

    // async create(ctx) {
    //     let entity

    //     const { user } = ctx.state
    //     const { sound } = ctx.request.body

    //     if (typeof sound !== 'number') {
    //         ctx.throw(400, 'Only ID can be passed to this request')
    //     }

    //     // Check if liked sound exists in the DB
    //     const soundFromDB = await strapi.services.sound.findOne({ id: sound })
    //     if (!soundFromDB) {
    //         ctx.throw(400, 'Sound does not exist')
    //     }

    //     // Check if there is no existing like already
    //     const existingLike = await strapi.services.like.findOne({
    //         user: user.id,
    //         sound
    //     })

    //     if (existingLike) {
    //         ctx.throw(400, 'You already liked this post')
    //     }

    //     if (ctx.is('multipart')) {
    //         ctx.throw(400, 'Multipart request not allowed, only make JSON requests')
    //     } else {
    //         entity = await strapi.services.like.create({ sound, user })
    //     }
    //     return sanitizeEntity(entity, { model: strapi.models.like })
    // }
}
