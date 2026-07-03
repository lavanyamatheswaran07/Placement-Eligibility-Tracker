/**
 * Format timestamp or ISO string to a human-readable date and time.
 * @param {any} val - Timestamp, ISO string, or Date object.
 * @returns {string}
 */
export function formatDate(val) {
  if (!val) return 'N/A';
  const date = new Date(val);
  if (isNaN(date.getTime())) return 'N/A';
  
  return date.toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format currency CTC in LPA (Lakhs Per Annum).
 * @param {number} ctc - CTC in numbers.
 * @returns {string}
 */
export function formatCTC(ctc) {
  if (ctc === undefined || ctc === null) return 'N/A';
  return `₹${ctc.toFixed(1)} LPA`;
}

/**
 * Format CGPA value safely.
 * @param {number} cgpa - CGPA score.
 * @returns {string}
 */
export function formatCGPA(cgpa) {
  if (cgpa === undefined || cgpa === null) return '0.00';
  return cgpa.toFixed(2);
}
