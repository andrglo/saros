import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {connect} from 'react-redux'
import {IoMdMenu} from 'react-icons/io'
import {disconnect} from './controller'
import t from './lib/translate'
import {getUser} from './selectors/app'
import LinkMenu from './components/LinkMenu'

const Dashboard = props => {
  const {user} = props
  const [showUserMenu, setShowUserMenu] = useState(false)
  const {dispatch} = props
  return (
    <React.Fragment>
      <div className="fixed flex justify-between w-full shadow-lg bg-primary text-primary h-12 sm:h-16 p-2 sm:p-4">
        <button
          id="drawerButton"
          type="button"
          className="items-center ml-2 sm:invisible"
        >
          <IoMdMenu />
        </button>
        <div className="relative h-8 mr-2">
          <button
            id="userButton"
            type="button"
            className="flex h-8 sm:items-center"
            onClick={() => {
              setShowUserMenu(!showUserMenu)
            }}
          >
            <img
              className="w-8 h-8 rounded-full"
              src={user.photoURL}
              alt="Avatar of User"
            />
            <span className="hidden md:inline-block ml-2">
              {user.displayName}
            </span>
          </button>
          {showUserMenu && (
            <LinkMenu
              className="absolute right-0 mt-1"
              onClose={() => {
                setShowUserMenu(false)
              }}
              options={[
                {label: t`My account`, link: '/account'},
                {label: t`Preferences`, link: '/preferences'},
                {label: t`Log out`, link: disconnect}
              ]}
            />
          )}
        </div>
      </div>
      <div className="fixed h-full mt-12 sm:mt-16 w-0 sm:w-20 sm:shadow-inner overflow-x-hidden">
        Drawer
      </div>
      <div className="h-screen w-screen bg-default text-default pt-12 sm:pt-16 pl-0 sm:pl-20">
        Workspace
      </div>
    </React.Fragment>
  )
}

Dashboard.propTypes = {
  dispatch: PropTypes.func.isRequired,
  user: PropTypes.object.isRequired
}

export default connect(state => {
  return {
    user: getUser(state)
  }
})(Dashboard)
