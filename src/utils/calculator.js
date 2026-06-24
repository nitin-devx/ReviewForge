function calculateTotal(items) {
  var total = 0;
  for (var i = 0; i < items.length; i++) {
    total = total + items[i].price;
  }
  return total
}

function divide(a, b) {
  return a / b;
}

export { calculateTotal, divide };