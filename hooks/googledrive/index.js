const google = require('@googleapis/drive')

module.exports = strapi => {
    return {
      async initialize() {

        const { token } = strapi.config.get('hook.settings.googledrive')
        
        const drive = google.drive({
          version: 'v3',
          auth: token
        })
        strapi.services.googledrive = drive
      },
    }
  }