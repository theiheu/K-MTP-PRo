export const numberToVietnameseWords = (n: number): string => {
  if (n === 0) return 'Không đồng';

  const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
  const units = ['', 'nghìn', 'triệu', 'tỷ'];

  const groupToWords = (num: number): string => {
    if (num === 0) return '';

    const h = Math.floor(num / 100);
    const t = Math.floor((num % 100) / 10);
    const o = num % 10;
    let result = '';

    if (h > 0) result += ones[h] + ' trăm ';
    if (t > 1) {
      result += ones[t] + ' mươi ';
      if (o === 1) result += 'mốt';
      else if (o === 5) result += 'lăm';
      else if (o > 0) result += ones[o];
    } else if (t === 1) {
      result += 'mười ';
      if (o === 5) result += 'lăm';
      else if (o > 0) result += ones[o];
    } else if (t === 0 && h > 0 && o > 0) {
      result += 'lẻ ' + ones[o];
    } else if (o > 0) {
      result += ones[o];
    }

    return result.trim();
  };

  const groups: number[] = [];
  let temp = Math.floor(n);
  while (temp > 0) {
    groups.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  let result = '';
  for (let i = groups.length - 1; i >= 0; i--) {
    if (groups[i] > 0) {
      result += groupToWords(groups[i]) + ' ' + units[i] + ' ';
    }
  }

  result = result.trim();
  return result.charAt(0).toUpperCase() + result.slice(1) + ' đồng';
};
