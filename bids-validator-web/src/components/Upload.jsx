// dependencies -------------------------------------------------------

import React from 'react'
import ReactDOM from 'react-dom'

const Upload = (props) => {
  const fileSelect  = React.useRef(null);
  React.useEffect(() => {
    fileSelect.current.setAttribute('webkitdirectory', true)
    fileSelect.current.setAttribute('directory', true)
  })
  const _click = (e) => {
    if (props.onClick) {
      props.onClick(e)
    }
  }

  const _onFileSelect = (e) => {
    if (e.target && e.target.files.length > 0) {
      let files = e.target.files
      let results = { list: files }
      props.onChange(results)
    }
  }

  return (
      <input
        type="file"
        className="dirUpload-btn"
        onClick={_click}
        onChange={_onFileSelect}
        ref={fileSelect}
      />
  )
}

export default Upload
