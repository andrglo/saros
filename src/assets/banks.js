import {
  CreditcardIcon,
  VisaIcon,
  MastercardIcon,
  MoneyBillIcon,
  BankIcon,
  ItauIcon,
  NameIcon
} from './icons'
import t from '../lib/translate'

export const banks = {
  wallet: {
    getName: () => t`Wallet`,
    type: 'cash',
    icon: MoneyBillIcon
  },
  bank: {
    getName: () => t`Bank`,
    type: 'bank',
    icon: BankIcon
  },
  itau: {
    getName: () => 'Itaú',
    type: 'bank',
    icon: ItauIcon
  },
  creditcard: {
    getName: () => t`Credit card`,
    type: 'creditcard',
    icon: CreditcardIcon
  },
  visa: {
    getName: () => 'Visa',
    type: 'creditcard',
    icon: VisaIcon
  },
  mastercard: {
    getName: () => 'Mastercard',
    type: 'creditcard',
    icon: MastercardIcon
  }
}

export const getBankIcon = account => {
  const bank = account && (account.bank || account.type)
  if (banks[bank]) {
    return banks[bank].icon
  }
  return NameIcon
}
