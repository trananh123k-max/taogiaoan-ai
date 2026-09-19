const fileText = "\n\n,,,,,,,,,,\n1,2,,,,,,,,\n,,,,,,,,,\n";
let csv = fileText.replace(/,{2,}/g, ','); 
csv = csv.split('\n').filter(line => line.replace(/,/g, '').trim().length > 0).join('\n');
console.log("OLD", fileText.length, "NEW", csv.length);
console.log(csv);
