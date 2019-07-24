import test from 'ava'
import t, {setTranlations} from '../translate'

setTranlations({
  there_is_n_option_to_win: [
    'Existe * opção para vencer',
    'Existem * opções para vencer'
  ],
  update_available: 'Atualização disponível!'
})

test('translate', test => {
  const result = t`Update available!`
  test.log(result)
  test.is(result, 'Atualização disponível!')
  test.pass()
})

test('translate with plural', test => {
  const result = t`There is ${5} option to win`
  test.log(result)
  test.is(result, 'Existem 5 opções para vencer')
  test.pass()
})
