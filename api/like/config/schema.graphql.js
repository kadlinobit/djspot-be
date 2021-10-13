module.exports = {
    definition: ``,
    query: ``,
    mutation: `
        toggleLike(sound: ID): Like!
    `,
    type: {},
    resolver: {
        Query: {},
        Mutation: {
            toggleLike: {
                description:
                    'Toggles user like for specific sound record (either creates new like or deletes existing)',
                resolverOf: 'application::like.like.toggle',
                resolver: 'application::like.like.toggle'
            }
        }
    }
}
