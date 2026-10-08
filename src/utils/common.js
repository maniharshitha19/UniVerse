// Small helpers used by several modules.

// Public user fields that are safe to show to other students.
const userPublic = { id: true, name: true, avatarUrl: true };

// "React ", "react", "REACT" -> "react" (and removes duplicates/empties)
function normalizeSkills(skills = []) {
  return [...new Set(skills.map((s) => s.trim().toLowerCase()).filter(Boolean))];
}

// Treats "" (empty search box) the same as "not given".
function emptyToUndefined(value) {
  return typeof value === 'string' && value.trim() === '' ? undefined : value;
}

module.exports = { userPublic, normalizeSkills, emptyToUndefined };
