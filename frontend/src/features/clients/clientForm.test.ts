import { describe, expect, it } from 'vitest'
import { emptyToUndefined } from './clientForm'

describe('emptyToUndefined', () => {
  it('turns an empty string into undefined', () => {
    expect(emptyToUndefined('')).toBeUndefined()
  })

  it('turns a whitespace-only string into undefined too', () => {
    // Порожнє поле форми, у яке хтось клацнув пробілом і вийшов, мусить
    // означати "не заповнено" так само, як справді порожнє — інакше
    // toClientWriteDto (clientForm.ts) надішле бекенду salonName: "   ",
    // а не пропустить поле зовсім.
    expect(emptyToUndefined('   ')).toBeUndefined()
    expect(emptyToUndefined('\t\n')).toBeUndefined()
  })

  it('passes a non-empty value through unchanged — including its surrounding whitespace', () => {
    // На відміну від обов'язкових полів (firstName/lastName/phone),
    // які toClientWriteDto явно тримить, необов'язкові йдуть через цю
    // функцію без .trim() — значення з пробілами всередині чи по
    // краях лишається як є, поки воно не ЦІЛКОМ пробіли.
    expect(emptyToUndefined('Салон Краси')).toBe('Салон Краси')
    expect(emptyToUndefined('  Салон Краси  ')).toBe('  Салон Краси  ')
  })
})
