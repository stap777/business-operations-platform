/**
 * Utility to convert numbers to Indian numbering system currency words.
 * Example: 1010 -> "One Thousand Ten Rupees Only"
 */
export function numberToWords(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '';
  const n = Math.round(Number(num) * 100) / 100;
  const rupees = Math.floor(n);
  const paise = Math.round((n - rupees) * 100);

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function convertBelowThousand(val: number): string {
    let str = '';
    if (val >= 100) {
      str += ones[Math.floor(val / 100)] + ' Hundred ';
      val %= 100;
    }
    if (val >= 20) {
      str += tens[Math.floor(val / 10)] + (val % 10 ? ' ' + ones[val % 10] : '');
    } else if (val > 0) {
      str += ones[val];
    }
    return str.trim();
  }

  function convertRupees(val: number): string {
    if (val === 0) return 'Zero';
    let res = '';
    const crore = Math.floor(val / 10000000);
    val %= 10000000;
    const lakh = Math.floor(val / 100000);
    val %= 100000;
    const thousand = Math.floor(val / 1000);
    val %= 1000;
    const remainder = val;

    if (crore > 0) res += convertRupees(crore) + ' Crore ';
    if (lakh > 0) res += convertBelowThousand(lakh) + ' Lakh ';
    if (thousand > 0) res += convertBelowThousand(thousand) + ' Thousand ';
    if (remainder > 0) res += convertBelowThousand(remainder);

    return res.trim();
  }

  let words = convertRupees(rupees) + ' Rupees';
  if (paise > 0) {
    words += ' and ' + convertBelowThousand(paise) + ' Paise';
  }
  return words + ' Only';
}
