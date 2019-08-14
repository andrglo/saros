import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import Form from '../components/Form'
import Input from '../components/Input'
import {getUid} from '../selectors/app'

const log = debug('profile')

const ProfileEdit = props => {
  log('render', props)
  const {dispatch, formName, uid} = props

  return (
    <Form
      className="mx-auto max-w-md"
      formName={formName}
      title={t`User account`}
      descriptionFields="firstName"
      collection={`users/${uid}`}
    >
      <div className="flex">
        <Input className="mx-1" id="firstName" label={t`Name`} />
        <Input
          className="mx-1"
          id="middleName"
          label={t`Middle name`}
          placeholder="Tecle algo"
          validate={value => {
            if (value.length > 5) {
              throw new Error('Maximum length is 5')
            }
          }}
        />
        <Input className="mx-1" id="lastName" label={t`Last name`} />
      </div>
    </Form>
  )
}

ProfileEdit.propTypes = {
  dispatch: PropTypes.func.isRequired,
  formName: PropTypes.string.isRequired,
  uid: PropTypes.string.isRequired
}

export default connect(state => {
  const formName = 'profileEdit'
  return {
    formName,
    uid: getUid(state)
  }
})(ProfileEdit)
