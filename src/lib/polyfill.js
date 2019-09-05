export const MINDOUBLE = 1e-12
if (Math.isEqual === undefined) {
  Math.isEqual = (n1, n2) =>
    Math.abs((n1 || 0) - (n2 || 0)) < MINDOUBLE
}
if (Math.isZero === undefined) {
  Math.isZero = n => Math.abs(n || 0) < MINDOUBLE
}
if (Math.isNegative === undefined) {
  Math.isNegative = n => (n || 0) < -MINDOUBLE
}
if (Math.isPositive === undefined) {
  Math.isPositive = n => (n || 0) > MINDOUBLE
}
