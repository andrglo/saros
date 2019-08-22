import React, {useState, useRef, useCallback} from 'react'
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
import useOnClickOutside from './hooks/useOnClickOutside'

const log = debug('dashboard')

const SLIDE_LEFT_TIMESPAN = 300 // --slide-left-timespan: 0.3s

const Drawer = () => {
  return <div>Todo: Quick links</div>
}

const Dashboard = props => {
  log('render', props)
  const {user, children, isHome, dispatch} = props

  const drawerRef = useRef(null)
  const menuButtonRef = useRef(null)
  const [isDrawerOpen, openDrawer] = useState(null)

  useOnClickOutside(
    drawerRef,
    useCallback(() => {
      openDrawer(false)
      setTimeout(() => {
        openDrawer(null)
      }, SLIDE_LEFT_TIMESPAN)
    }, [openDrawer])
  )

  const [focusItemInUserMenu, setFocusItemInUserMenu] = useState(
    false
  )
  const [showUserMenu, setShowUserMenu] = useState(false)
  const drawer = <Drawer />
  return (
    <React.Fragment>
      <div className="dashboard bg-default text-default h-screen">
        <div className="toolbar flex shadow-lg bg-toolbar text-toolbar p-2 sm:p-4">
          <button
            type="button"
            className="ml-2 h-4 self-center sm:hidden focus:outline-none"
            onClick={() => openDrawer(!isDrawerOpen)}
          >
            <BarsIcon />
          </button>
          <p className="ml-4 sm:ml-0 flex-1 text-3xl self-center">
            Saros
          </p>
          {!isHome && (
            <button
              className=" hover:bg-menuHover rounded-full focus:outline-none focus:shadow-outline"
              type="button"
              onClick={() => {
                dispatch(pushBrowserLocation('/'))
              }}
            >
              <HomeIcon className="w-6 h-6 m-auto" />
            </button>
          )}
          <button
            type="button"
            ref={menuButtonRef}
            className="self-center ml-4 rounded-sm sm:rounded-full w-8 h-8 overflow-hidden focus:outline-none focus:shadow-outline"
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
                className="w-auto"
                src={user.photoURL}
                alt="Avatar of User"
              />
            ) : (
              <FaceIcon className="w-6 h-6" />
            )}
          </button>
          {showUserMenu && (
            <LinkMenu
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
        <div className="w-0 sm:w-auto overflow-hidden text-drawer bg-drawer">
          {drawer}
        </div>
        <div className="relative overflow-auto">
          {children || 'Dashboard view will go here'}
        </div>
      </div>
      {isDrawerOpen !== null && (
        <div className="fixed inset-0 overlay">
          <div
            ref={drawerRef}
            className={cn(
              'fixed top-0 left-0 h-screen w-2/3 w-auto overflow-hidden text-drawer bg-drawer',
              {
                'slide-in-left': isDrawerOpen,
                'slide-out-left': !isDrawerOpen
              }
            )}
          >
            {drawer}
          </div>
        </div>
      )}
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
