export function packageExists(name) {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}
