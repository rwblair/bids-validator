import Issue from './issues'

/**
 * Similar to native JSON.parse but returns a promise and
 * runs jshint for more thorough error reporting
 */
function parse(file, contents) {
  return new Promise(resolve => {
    let jsObj
    let err
    try {
      jsObj = JSON.parse(contents)
    } catch (exception) {
      err = exception
    } finally {
      if (err) {
        resolve({
          issues: [new Issue({
            code: 27,
            file: file,
            reason: err.toString()
          })],
        })
      } else {
        resolve({ issues: [], parsed: jsObj })
      }
    }
  })
}

export default {
  parse
}
