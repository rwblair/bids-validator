const BIDS = require('./obj')
const reset = require('./reset')
const quickTest = require('./quickTest')
const quickTestError = require('./quickTestError')
const fullTest = require('./fullTest')
const utils = require('../../utils')

/**
 * Start
 *
 * Takes either a filelist array or
 * a path to a BIDS directory and an
 * options object and starts
 * the validation process and
 * returns the errors and warnings as
 * arguments to the callback.
 */
const start = (dir, options, callback) => {
  utils.options.parse(options, function(issues, options) {
    if (issues && issues.length > 0) {
      // option parsing issues
      callback({ config: issues })
    } else {
      BIDS.options = options
      reset(BIDS)
      utils.files.readDir(dir, function(files) {
        const couldBeBIDS = quickTest(files, BIDS.options)
        if (couldBeBIDS) {
          fullTest(files, callback)
        } else {
          // Return an error immediately if quickTest fails
          const issue = quickTestError(dir)
          let summary = {
            sessions: [],
            subjects: [],
            tasks: [],
            modalities: [],
            totalFiles: Object.keys(files).length,
            size: 0,
          }
          callback(utils.issues.format([issue], summary, options))
        }
      })
    }
  })
}

module.exports = start
