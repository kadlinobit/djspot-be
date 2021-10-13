'use strict'

const { parseMultipartData, sanitizeEntity } = require('strapi-utils')
const _ = require('lodash')
/**
 * Read the documentation (https://strapi.io/documentation/developer-docs/latest/development/backend-customization.html#core-controllers)
 * to customize this controller
 */

module.exports = {
    /**
     * Retrieves 1 or more records.
     *
     * @return {Array}
     */

    async find(ctx) {
        let entities
        if (ctx.query._q) {
            entities = await strapi.services.sound.search(ctx.query)
        } else {
            entities = await strapi.services.sound.find(ctx.query)
        }

        // Getting related like records - COMMENTED OUT BECAUSE I FOUND BETTER WAY, BUT KEEPING IT JUST TO BE SURE
        // const soundIdArray = entities.map((entity) => entity.id)
        // const likes = await strapi.services.like.find({ 'sound.id_in': soundIdArray }, ['id']) //Defining ID as a column so no relation column is autoPopulated
        // const likesGrouped = _.groupBy(likes, 'sound')

        return entities.map((entity) => {
            // COMMENTED OUT BECAUSE I FOUND BETTER WAY, BUT KEEPING IT JUST TO BE SURE
            // entity.likesCount = likesGrouped[entity.id] ? likesGrouped[entity.id].length : 0
            // entity.isLikedByMe =
            //     ctx.state.user && likesGrouped[entity.id]
            //         ? likesGrouped[entity.id].some((like) => like.user === ctx.state.user.id)
            //         : false

            entity.likesCount = entity.likes.length
            entity.isLikedByMe = ctx.state.user
                ? entity.likes.some((like) => like.user === ctx.state.user.id)
                : false
            return sanitizeEntity(entity, { model: strapi.models.sound })
        })
    },
    /**
     * Retrieve a record.
     *
     * @return {Object}
     */

    async findOne(ctx) {
        const { id } = ctx.params

        const entity = await strapi.services.sound.findOne({ id })

        // Get likes count and isLikedByMe flag
        if (entity) {
            // COMMENTED OUT BECAUSE I FOUND BETTER WAY, BUT KEEPING IT JUST TO BE SURE
            // entity.likesCount = await strapi.services.like.count({ 'sound.id': id })
            // entity.isLikedByMe = ctx.state.user
            //     ? !!(await strapi.services.like.count({
            //           sound: id,
            //           user: ctx.state.user.id
            //       }))
            //     : false

            entity.likesCount = entity.likes.length
            entity.isLikedByMe = ctx.state.user
                ? entity.likes.some((like) => like.user === ctx.state.user.id)
                : false
        }

        return sanitizeEntity(entity, { model: strapi.models.sound })
    },
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

        // Add zero likes count to the response
        if (entity) {
            entity.likesCount = 0
            entity.isLikedByMe = false
        }
        return sanitizeEntity(entity, { model: strapi.models.sound })
    },

    /**
     * Update a record.
     *
     * @return {Object}
     */

    async update(ctx) {
        const { id } = ctx.params
        let entity

        const [sound] = await strapi.services.sound.find({
            id: ctx.params.id,
            'dj.user.id': ctx.state.user.id
        })

        if (!sound) {
            return ctx.unauthorized(`You can't update this entry`)
        }

        if (ctx.is('multipart')) {
            const { data, files } = parseMultipartData(ctx)

            // Remove current photo from media if new is being uploaded or current one discarded
            if (sound.photo && (!_.isEmpty(files) || data.photo === null)) {
                await strapi.plugins.upload.services.upload.remove(sound.photo)
            }
            // Line that ensures that user reference stays correct - disabled for now
            // data.user = ctx.state.user.id

            entity = await strapi.services.sound.update({ id }, data, {
                files
            })
        } else {
            entity = await strapi.services.sound.update({ id }, ctx.request.body)
        }

        // Get likes count and isLikedByMe flag
        if (entity) {
            // entity.likesCount = await strapi.services.like.count({ sound: id })
            // entity.isLikedByMe = !!(await strapi.services.like.count({
            //     sound: id,
            //     user: ctx.state.user.id
            // }))

            entity.likesCount = entity.likes.length
            entity.isLikedByMe = entity.likes.some((like) => like.user === ctx.state.user.id)
        }

        return sanitizeEntity(entity, { model: strapi.models.sound })
    },

    /**
     * Delete a record.
     *
     * @return {Object}
     */

    async delete(ctx) {
        const { id } = ctx.params

        const [sound] = await strapi.services.sound.find({
            id: ctx.params.id,
            'dj.user.id': ctx.state.user.id
        })

        if (!sound) {
            return ctx.unauthorized(`You can't delete this sound`)
        }

        // Remove DJ photo from uploads
        if (sound.photo) {
            await strapi.plugins.upload.services.upload.remove(sound.photo)
        }

        const entity = await strapi.services.sound.delete({ id })
        return sanitizeEntity(entity, { model: strapi.models.sound })
    },

    /**
     * Toggles like for particular sound and user - if like exists - deletes it, if not - adds new like.
     *
     * @return {Object}
     */
    async toggleLike(ctx) {
        let entity

        const { user } = ctx.state
        let { id } = ctx.request.body
        id = parseInt(id)

        if (typeof id !== 'number') {
            ctx.throw(400, 'Only ID can be passed to this request')
        }

        if (ctx.is('multipart')) {
            ctx.throw(400, 'Multipart request not allowed, only make JSON requests')
        }

        // Check if liked sound exists in the DB
        const soundFromDB = await strapi.services.sound.findOne({ id })
        if (!soundFromDB) {
            ctx.throw(400, 'Sound does not exist')
        }

        // Check for existing like
        const existingLike = await strapi.services.like.findOne({
            user: user.id,
            sound: id
        })

        // Toggle like - if exists, delete. Otherwise, create.
        if (existingLike) {
            await strapi.services.like.delete({ id: existingLike.id })
        } else {
            await strapi.services.like.create({ sound: id, user })
        }

        entity = await strapi.services.sound.findOne({ id })
        entity.likesCount = entity.likes.length
        entity.isLikedByMe = entity.likes.some((like) => like.user === ctx.state.user.id)

        return sanitizeEntity(entity, { model: strapi.models.sound })
    }
}
