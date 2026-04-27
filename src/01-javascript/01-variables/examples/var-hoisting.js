// ============================================
// VAR and HOISTING Examples
// ============================================

console.log('=== 1. var hoisting ===');
console.log('a =', a); // undefined (not an error!)
var a = 5;
console.log('a =', a); // 5

// What JavaScript actually does:
// var a;              // Declaration hoisted to top
// console.log(a);     // undefined
// a = 5;              // Assignment stays in place

console.log('\n=== 2. let/const - temporal dead zone ===');
// console.log(b); // ❌ ReferenceError: Cannot access before initialization
let b = 10;
console.log('b =', b); // 10

console.log('\n=== 3. var function scope (not block scope) ===');
function testVar() {
  if (true) {
    var x = 'hello';
  }
  console.log('x inside function:', x); // ✅ Works! var ignores block scope
}
testVar();

function testLet() {
  if (true) {
    let y = 'world';
  }
  // console.log(y); // ❌ Error: y is not defined (let respects block scope)
}
testLet();

console.log('\n=== 4. var in loops - the classic problem ===');
console.log('With var:');
for (var i = 0; i < 3; i++) {
  setTimeout(function () {
    console.log('  var i:', i); // All print 3!
  }, 100);
}

setTimeout(function () {
  console.log('\nWith let:');
  for (let j = 0; j < 3; j++) {
    setTimeout(function () {
      console.log('  let j:', j); // Prints 0, 1, 2
    }, 100);
  }
}, 200);

setTimeout(function () {
  console.log('\n=== 5. var redeclaration ===');
  var name = 'John';
  console.log('name:', name);

  var name = 'Jane'; // ✅ No error with var
  console.log('name:', name);

  // With let:
  let city = 'NYC';
  // let city = 'LA'; // ❌ Error: Identifier 'city' has already been declared
}, 400);

setTimeout(function () {
  console.log('\n=== 6. Why var is problematic ===');
  console.log('1. Function scope instead of block scope');
  console.log('2. Can be redeclared without error');
  console.log('3. Hoisting creates confusion');
  console.log('4. No temporal dead zone (can use before declaration)');
  console.log('\n=> Use let and const instead!');
}, 600);
