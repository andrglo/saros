export default (value, escapeHatch = '') =>
  typeof value === typeof escapeHatch ? value : escapeHatch
