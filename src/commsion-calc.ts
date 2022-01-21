function calculateCommision(ammount : number) : number {
  var percentCalc = ammount * 0.1
  if (percentCalc > 2000) {
    return 2000;
  } else {
    return Math.round((percentCalc + Number.EPSILON) * 100) / 100;
  }
}

export default calculateCommision;
