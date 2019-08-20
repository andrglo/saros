import React, {useState, useRef} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import cn from 'classnames'
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

  const menuButtonRef = useRef(null)
  const [isDrawerOpen, openDrawer] = useState(false)

  const [focusItemInUserMenu, setFocusItemInUserMenu] = useState(
    false
  )
  const [showUserMenu, setShowUserMenu] = useState(false)
  return (
    <div className="dashboard bg-default text-default h-screen">
      <div className="toolbar flex justify-between shadow-lg bg-toolbar text-toolbar p-2 sm:p-4 z-30">
        <button
          type="button"
          className="items-center ml-2 mt-3 mb-3 sm:invisible focus:outline-none focus:shadow-outline"
          onClick={() => openDrawer(!isDrawerOpen)}
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
              ref={menuButtonRef}
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
                  className="w-8 h-8 rounded-full focus:outline-none"
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
                menuButtonRef={menuButtonRef}
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
      <div
        className={cn(
          'text-drawer bg-drawer w-0 sm:w-auto overflow-hidden',
          {
            'w-auto': isDrawerOpen
          }
        )}
      >
        Todo: Quick links
      </div>
      <div className="relative overflow-auto">
        {children || 'Dashboard view will go here'}
      </div>
    </div>
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
