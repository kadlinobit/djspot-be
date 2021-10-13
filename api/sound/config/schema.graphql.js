module.exports = {
    definition: `
        extend type Sound {
            likesCount: Int,
            isLikedByMe: Boolean
        }
    `,
    query: ``,
    mutation: `
        toggleSoundLike(id: ID): Sound!
    `,
    type: {},
    resolver: {
        Query: {},
        Mutation: {
            toggleSoundLike: {
                description:
                    'Toggles user like for specific sound record (either creates new like or deletes existing)',
                resolverOf: 'application::sound.sound.toggleLike',
                resolver: 'application::sound.sound.toggleLike'
            }
        }
    }
}
