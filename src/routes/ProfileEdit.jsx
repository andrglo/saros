import React from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import t from '../lib/translate'
import Form from '../components/Form'
import SmartInput from '../components/SmartInput'
import {getUid} from '../selectors/app'
import {getFormValues, getForm} from '../selectors/forms'
import {Check} from '../assets/icons'
import {getCountries, getStates, getCities} from '../selectors/atlas'

const log = debug('profile')

const ProfileEdit = props => {
  log('render', props)
  const {dispatch, formName, uid, countries, states, cities} = props

  return (
    <Form
      className="mx-auto max-w-lg grid grid-gap-1 p-1 grid-columns-1 sm:grid-columns-3 border-yellow-700 border"
      formName={formName}
      title={t`User account`}
      descriptionFields="firstName"
      collection={`users/${uid}`}
    >
      <SmartInput id="firstName" label={t`Name`} />
      <SmartInput
        id="middleName"
        label={t`Middle name`}
        validate={value => {
          if (value.length > 5) {
            throw new Error('Maximum length is 5')
          }
        }}
      />
      <SmartInput id="lastName" label={t`Last name`} />
      <div className="flex gy-full">
        <SmartInput id="emails[0]" label={t`email`} disabled />
        <Check className="self-end m-2 text-green-600" />
      </div>
      <div
        className="sm:gy-span-2 grid grid-gap-1"
        style={{
          gridTemplateColumns: '1fr minmax(5em, auto)'
        }}
      >
        <SmartInput
          id="country"
          label={t`Country`}
          options={countries}
          allowAnyValue
        />
        <SmartInput
          id="state"
          label={t`State`}
          options={states}
          allowAnyValue
        />
      </div>
      <SmartInput
        id="city"
        label={t`City`}
        options={cities}
        allowAnyValue
      />
    </Form>
  )
}

ProfileEdit.propTypes = {
  dispatch: PropTypes.func.isRequired,
  formName: PropTypes.string.isRequired,
  countries: PropTypes.array,
  states: PropTypes.array,
  cities: PropTypes.array,
  uid: PropTypes.string.isRequired
}

export default connect(state => {
  const formName = 'profileEdit'
  const form = getForm(state, {formName})
  const values = (form && getFormValues(form)) || {}
  return {
    formName,
    countries: getCountries(),
    states: getStates(values.country),
    cities: getCities(values.country, values.state),
    uid: getUid(state)
  }
})(ProfileEdit)
