/**
 * Evaluates whether a student meets the criteria for a placement drive.
 * @param {object} student - Student profile object.
 * @param {object} drive - Job drive object.
 * @returns {object} - { eligible: boolean, reasons: string[] }
 */
export function checkEligibility(student, drive) {
  if (!student) {
    return { eligible: false, reasons: ["Student profile not loaded."] };
  }
  if (!drive) {
    return { eligible: false, reasons: ["Job drive details not found."] };
  }

  const criteria = drive.eligibilityCriteria;
  const reasons = [];

  // Check CGPA
  if (student.cgpa < criteria.minCgpa) {
    reasons.push(`CGPA is ${student.cgpa.toFixed(2)}, but minimum required is ${criteria.minCgpa.toFixed(2)}.`);
  }

  // Check Active Backlogs
  if (student.activeBacklogs > criteria.maxActiveBacklogs) {
    reasons.push(`Active backlogs: ${student.activeBacklogs}, but maximum allowed is ${criteria.maxActiveBacklogs}.`);
  }

  // Check Branch
  if (criteria.allowedBranches && criteria.allowedBranches.length > 0) {
    if (!criteria.allowedBranches.includes(student.branch)) {
      reasons.push(`Branch '${student.branch}' is not in the allowed list: ${criteria.allowedBranches.join(", ")}.`);
    }
  }

  return {
    eligible: reasons.length === 0,
    reasons
  };
}
