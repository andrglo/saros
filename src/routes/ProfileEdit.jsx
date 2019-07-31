import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import Form from '../components/Form'
import FormInput from '../components/FormInput'
import {getUid} from '../selectors/app'

const log = debug('profile')

const ProfileEdit = props => {
  log('render', props)
  const {dispatch, formName, uid} = props

  return (
    <Form
      className=""
      formName={formName}
      title={t`User account`}
      descriptionFields="firstName"
      collection="users"
      id={uid}
    >
      <FormInput id="firstName" label={t`Name`} />
      <FormInput id="middleName" label={t`Middle name`} />
      <FormInput id="lastName" label={t`Last name`} />
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
