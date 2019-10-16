/* eslint-disable react/prop-types */
import React from 'react'
import cn from 'classnames'

export {
  FaUser as ProfileIcon,
  FaSignOutAlt as SignoutIcon,
  FaCog as SettingsIcon,
  FaBars as BarsIcon,
  FaHome as HomeIcon,
  FaInfo as InfoIcon,
  FaRegUserCircle as FaceIcon,
  FaChevronDown as ChevronDown,
  FaCheck as Check,
  FaMoneyBill as MoneyBillIcon,
  FaLandmark as BankIcon,
  FaCreditCard as CreditcardIcon,
  FaCcMastercard as MastercardIcon,
  FaCcVisa as VisaIcon
} from 'react-icons/fa'

export {
  MdLaunch as LaunchIcon,
  MdClose as CloseIcon,
  MdWarning as WarningIcon,
  MdError as ErrorIcon,
  MdWeb as FormIcon,
  MdArrowBack as ArrowBackIcon,
  MdArrowForward as ArrowForwardIcon
} from 'react-icons/md'

export const ItauIcon = ({className}) => null // todo
// <img
//   className={className}
//   src={require('./itau.svg')}
//   alt="logo itau"
// />

export const NameIcon = props => {
  const {className, name = '?'} = props
  const parts = name.split(' ')
  let slug
  if (parts.length > 1) {
    slug = parts.map(part => part[0]).join('')
  } else {
    slug = name.slice(0, 3)
  }
  return (
    <span
      className={cn(
        'italic text-xs font-thin bg-highlight rounded-sm px-1',
        className
      )}
    >
      {slug}
    </span>
  )
}
