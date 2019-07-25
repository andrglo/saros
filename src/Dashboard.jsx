import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {disconnect} from './controller'
import t from './lib/translate'
import Alert from './components/Alert'

const Dashboard = props => {
  const [showAlert, setShowAlert] = useState(true)
  const {dispatch} = props
  return (
    <React.Fragment>
      {showAlert && (
        <Alert
          title={t`Update available!`}
          message={t`Update now?`}
          buttonCaption={t`Yes`}
          position="footer"
          type="warning"
          onClose={() => setShowAlert(false)}
          onClick={() => console.log('dashboard click')}
        />
      )}
      <div className="text-red-600">
        Dashboard
        <button
          className="bg-secondary hover:bg-teal-500 ml-2 text-primary font-bold py-2 px-4 rounded-full"
          type="button"
          onClick={disconnect}
        >
          {t`Out`}
        </button>
      </div>
    </React.Fragment>
  )
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired
}

export default connect()(Dashboard)
