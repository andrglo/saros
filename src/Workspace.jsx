import React, {useState, useRef, useCallback} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import cn from 'classnames'
import debug from 'debug'

import Drawer from './Drawer'
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
import DirtyForms from './components/DirtyForms'

const log = debug('workspace')

const SLIDE_LEFT_TIMESPAN = 300 // --slide-left-timespan: 0.3s

const Workspace = props => {
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

  const [showUserMenu, setShowUserMenu] = useState(false)
  const drawer = <Drawer />
  return (
    <React.Fragment>
      <div className="workspace h-screen font-sans bg-default text-default">
        <div className="toolbar flex shadow-lg bg-toolbar text-toolbar p-2 sm:p-4 items-center">
          <button
            type="button"
            className="ml-2 h-4 self-center sm:hidden focus:outline-none"
            onClick={() => openDrawer(!isDrawerOpen)}
          >
            <BarsIcon />
          </button>
          <p className="ml-4 sm:ml-0 flex-1 text-3xl self-center">
            {process.env.NODE_ENV === 'production' ? 'Saros' : ''}
          </p>
          <DirtyForms className="mr-2 pt-1 sm:pt-0" />
          {!isHome && (
            <button
              className="sm:pt-0 hover:bg-menuHover w-10 h-10 rounded-full hover:bg-highlight"
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
            className="ml-4 rounded-sm sm:rounded-full w-8 h-8 overflow-hidden"
            onClick={() => {
              setShowUserMenu(!showUserMenu)
            }}
          >
            {user.photoURL ? (
              <img
                className="w-full h-full"
                src={user.photoURL}
                alt="Avatar of User"
              />
            ) : (
              <FaceIcon className="w-full h-full" />
            )}
          </button>
          {showUserMenu && (
            <LinkMenu
              onClose={() => {
                setShowUserMenu(false)
              }}
              menuButtonRef={menuButtonRef}
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
        <div className="w-0 sm:w-auto overflow-x-hidden shadow-lg text-drawer bg-drawer">
          {drawer}
        </div>
        <div className="relative overflow-auto">{children}</div>
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

Workspace.propTypes = {
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
})(Workspace)
