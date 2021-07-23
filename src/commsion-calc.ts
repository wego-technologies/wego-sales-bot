function calculateCommision(ammount : number) {
  var percentCalc = ammount * 0.2
  if (percentCalc > 2000) {
    return 2000;
  } else {
    return percentCalc.toFixed(2);
  }
}

export default calculateCommision;