/**
 * Checks if a student is eligible for a company placement drive
 * based on CGPA and active arrears requirements.
 * 
 * @param {object} student - Student details containing cgpa and arrears
 * @param {object} company - Company requirements containing minimumCGPA and maximumArrears
 * @returns {boolean} True if eligible, false otherwise
 */
export function checkEligibility(student, company) {
  if (!student || !company) return false;
  return (
    student.cgpa >= company.minimumCGPA &&
    student.arrears <= company.maximumArrears
  );
}
