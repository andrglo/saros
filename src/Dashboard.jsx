import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import debug from 'debug'

import {disconnect} from './controller'
import t from './lib/translate'
import {getUser, getBrowserLocation} from './selectors/app'
import LinkMenu from './components/LinkMenu'
import {pushBrowserLocation} from './actions/app'
import {
  ProfileIcon,
  SignoutIcon,
  SettingsIcon,
  BarsIcon,
  HomeIcon,
  FaceIcon
} from './assets/icons'

const log = debug('dashboard')

const Dashboard = props => {
  log('render', props)
  const {user, children, isHome, dispatch} = props

  const [focusItemInUserMenu, setFocusItemInUserMenu] = useState(
    false
  )
  const [showUserMenu, setShowUserMenu] = useState(false)
  return (
    <React.Fragment>
      <div className="dashboard fixed flex justify-between w-full shadow-lg bg-toolbar text-toolbar h-12 sm:h-16 p-2 sm:p-4">
        <button
          type="button"
          className="items-center ml-2 sm:invisible"
        >
          <BarsIcon />
        </button>
        <div className="flex items-center">
          {!isHome && (
            <button
              className="w-10 h-10 mr-4 hover:bg-menuHover rounded-full focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => {
                dispatch(pushBrowserLocation('/'))
              }}
            >
              <HomeIcon className="w-6 h-6 m-auto" />
            </button>
          )}
          <div className="relative">
            <div className="h-2" />
            <button
              type="button"
              className="rounded-full focus:outline-none focus:shadow-outline"
              onClick={() => {
                setFocusItemInUserMenu(false)
                setShowUserMenu(!showUserMenu)
              }}
              onKeyDown={event => {
                if (!showUserMenu) {
                  event.preventDefault()
                  setFocusItemInUserMenu(true)
                  setShowUserMenu(true)
                }
              }}
            >
              {user.photoURL ? (
                <img
                  className="w-8 h-8 rounded-full"
                  src={user.photoURL}
                  alt="Avatar of User"
                />
              ) : (
                <FaceIcon className="w-6 h-6" />
              )}
            </button>
            {showUserMenu && (
              <LinkMenu
                className="absolute right-0 mt-0 sm:mt-1"
                onClose={() => {
                  setShowUserMenu(false)
                }}
                focus={focusItemInUserMenu}
                options={[
                  {
                    icon: <ProfileIcon />,
                    label: t`My account`,
                    link: '/profile-edit'
                  },
                  {
                    icon: <SettingsIcon />,
                    label: t`Preferences`,
                    link: '/preferences'
                  },
                  {
                    divider: (
                      <div
                        key="div"
                        className="m-1 border border-menu"
                      />
                    )
                  },
                  {
                    icon: <SignoutIcon />,
                    label: t`Log out`,
                    link: disconnect
                  }
                ]}
              />
            )}
          </div>
        </div>
      </div>
      <div className="dashboard text-drawer bg-drawer fixed h-full mt-12 sm:mt-16 w-0 sm:w-40 sm:shadow-inner overflow-x-hidden">
        Todo: Quick links
      </div>
      <div className="dashboard h-screen w-screen bg-default text-default pt-12 sm:pt-16 pl-0 sm:pl-40">
        {children || 'Dashboard view will go here'}
      </div>
    </React.Fragment>
  )
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
  children: PropTypes.node,
  user: PropTypes.object.isRequired,
  isHome: PropTypes.bool
}

export default connect(state => {
  const browserLocation = getBrowserLocation(state)
  return {
    user: getUser(state),
    isHome: Boolean(
      !browserLocation || browserLocation.pathname === '/'
    )
  }
})(Dashboard)
