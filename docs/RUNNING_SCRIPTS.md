# ▶️ How to Run Scripts

A detailed guide on running JavaScript/TypeScript code, tests, and debugging.

## 📁 Project Structure

```
js-training/
├── src/
│   └── 01-javascript/
│       └── 01-variables/
│           ├── examples/       # Examples to run
│           ├── exercises/      # Your code
│           └── __tests__/      # Tests
└── package.json               # npm scripts
```

---

## 🟨 Running JavaScript Files

### Basic Execution

```bash
# Run JS file
node path/to/file.js

# Example from our project
node src/01-javascript/01-variables/examples/let-const.js
```

### Running with Arguments

```javascript
// script.js
const args = process.argv.slice(2);
console.log('Arguments:', args);
```

```bash
node script.js arg1 arg2 arg3
# Output: Arguments: ['arg1', 'arg2', 'arg3']
```

### Running with Environment Variables

```bash
# Set environment variable
NODE_ENV=development node script.js

# Use in code
console.log(process.env.NODE_ENV); // 'development'
```

### Interactive Mode (REPL)

```bash
# Start REPL
node

# Now you can execute JavaScript
> const x = 5;
> x * 2
10
> .exit  // Exit
```

---

## 🔷 Running TypeScript Files

### Using ts-node

```bash
# Run TS file
npx ts-node path/to/file.ts

# Example
npx ts-node src/02-typescript/01-types/examples/basic-types.ts
```

### Compile and Run

```bash
# Method 1: Compile and run
npx tsc file.ts      # Creates file.js
node file.js         # Run

# Method 2: Use npm script
npm run type-check   # Check types without compilation
```

### TypeScript REPL

```bash
# Start interactive TypeScript
npx ts-node

# Execute TypeScript code
> const message: string = 'Hello';
> message.toUpperCase()
'HELLO'
```

---

## 🧪 Running Tests (Jest)

### Basic Commands

```bash
# Run all tests
npm test

# Run tests with specific pattern
npm test -- 01-variables
npm test -- functions
npm test -- arrays

# Run specific test file
npm test -- src/01-javascript/01-variables/__tests__/variables.test.js
```

### Watch Mode

```bash
# Automatic restart on file changes
npm test -- --watch

# Watch mode only for one module
npm test -- --watch 01-variables
```

### Verbose Output

```bash
# Show more information
npm test -- --verbose

# Show code coverage
npm run test:coverage
```

### Running Individual Tests

```bash
# Run only tests with name "greet"
npm test -- -t "greet"

# Run only describe block
npm test -- -t "Variables Exercises"
```

### Debug Tests

```bash
# Run tests with Node debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Or use VS Code debug (see below)
```

---

## 🐛 Debugging in VS Code

### 1. Debug JavaScript/TypeScript Files

**Step 1:** Open the file you want to debug

**Step 2:** Set a breakpoint (click on line number)

**Step 3:** Press `F5` or `Run > Start Debugging`

**Step 4:** Select "Debug Current File" configuration

**Useful keys:**
- `F5` - Continue execution
- `F10` - Step Over (next line)
- `F11` - Step Into (enter function)
- `Shift+F11` - Step Out (exit function)
- `Shift+F5` - Stop debugging

### 2. Debug Jest Tests

**Method 1: VS Code Jest Runner**

If you have the `firsttris.vscode-jest-runner` extension installed:
1. Open test file
2. A `Debug` button will appear above each `test()`
3. Click on it

**Method 2: Launch Configuration**

1. Set breakpoint in test
2. `F5` → select "Debug Jest Tests"
3. Test will run with breakpoint stop

### 3. Debug Node.js Scripts

```bash
# Run with debugger
node --inspect-brk script.js

# In VS Code:
# 1. Run > Start Debugging
# 2. Select "Attach to Node Process"
# 3. Select process from list
```

### 4. Using debugger Statement

```javascript
function myFunction() {
  const x = 5;
  debugger; // Execution will stop here
  return x * 2;
}
```

---

## 📦 Running npm Scripts

### From package.json

```bash
# Run any script
npm run <script-name>

# Special scripts (don't need "run")
npm test
npm start
npm stop
```

### Our npm Scripts

```bash
# Testing
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With code coverage

# Code quality
npm run lint          # ESLint check
npm run lint:fix      # Automatic fixes
npm run type-check    # TypeScript check
```

### Passing Arguments to npm Scripts

```bash
# Use -- to pass arguments
npm test -- --watch
npm test -- 01-variables
npm run lint -- --fix
```

---

## 🌍 Environment Variables

### Creating .env File

```bash
# Create .env in project root
NODE_ENV=development
API_URL=http://localhost:3000
SECRET_KEY=my-secret-key
```

**IMPORTANT:** Add `.env` to `.gitignore`!

### Using in Code

```javascript
// Install dotenv
npm install dotenv

// In code
require('dotenv').config();

console.log(process.env.NODE_ENV);  // 'development'
console.log(process.env.API_URL);   // 'http://localhost:3000'
```

### Running with Environment Variables

```bash
# Once
NODE_ENV=production node script.js

# Multiple variables
NODE_ENV=production DEBUG=true node script.js

# With npm script
NODE_ENV=test npm test
```

---

## ⚙️ Workflow Examples

### 1. Working with Variables Module

```bash
# 1. Navigate to module
cd src/01-javascript/01-variables

# 2. Read README
cat README.md

# 3. Run examples
node examples/let-const.js
node examples/var-hoisting.js
node examples/scope.js

# 4. Open exercises in editor
code exercises/variables.js

# 5. Write code...

# 6. Run tests (from project root)
cd ../../..
npm test -- 01-variables

# 7. If tests fail - debug
# Set breakpoint in exercises/variables.js
# F5 → Debug Jest Tests

# 8. After success - commit
git add .
git commit -m "Completed 01-variables"
```

### 2. Experimenting with Code

```bash
# 1. Create temporary file
echo "console.log('Test');" > test.js

# 2. Run it
node test.js

# 3. Modify and run again
# (open in editor, change, save)
node test.js

# 4. Delete after experiments
rm test.js
```

### 3. Testing TypeScript

```bash
# 1. Create TS file
cat > test.ts << 'EOF'
const message: string = 'Hello TypeScript';
console.log(message);

function add(a: number, b: number): number {
  return a + b;
}

console.log(add(2, 3));
EOF

# 2. Run through ts-node
npx ts-node test.ts

# 3. Or compile and run
npx tsc test.ts  # Creates test.js
node test.js     # Run

# 4. Clean up
rm test.ts test.js
```

### 4. Quick Code Testing

```bash
# Use Node.js REPL for quick experiments
node

> const arr = [1, 2, 3, 4, 5];
> arr.map(x => x * 2)
[2, 4, 6, 8, 10]

> const sum = arr.reduce((a, b) => a + b, 0)
15

> .exit
```

---

## 🚨 Troubleshooting

### Issue: Module not found

```bash
# Error
Error: Cannot find module 'express'

# Solution
npm install  # Install all dependencies
```

### Issue: Permission denied

```bash
# Error
EACCES: permission denied

# Solution for scripts
chmod +x scripts/setup.sh

# Or run through bash
bash scripts/setup.sh
```

### Issue: Tests not found

```bash
# Error
No tests found

# Check
ls src/01-javascript/*/__tests__/*.test.js

# Run from project root
pwd  # Should be js-training/
npm test
```

### Issue: TypeScript errors

```bash
# Error
TS2304: Cannot find name 'process'

# Solution
npm install --save-dev @types/node
```

### Issue: Jest cache

```bash
# If tests behave strangely
npm test -- --clearCache
```

### Issue: Port already in use

```bash
# For Node.js servers
# Find process on port 3000
lsof -i :3000

# Kill process
kill -9 <PID>

# Or use different port
PORT=3001 node server.js
```

---

## 📚 Useful Commands

### Package Management

```bash
# Show installed packages
npm list --depth=0

# Find outdated packages
npm outdated

# Clean node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### File Viewing

```bash
# Show file content
cat file.js

# Show with line numbers
cat -n file.js

# Show beginning of file
head -n 20 file.js

# Show end of file
tail -n 20 file.js

# Live view (updates)
tail -f logs/app.log
```

### Search

```bash
# Find files
find . -name "*.test.js"

# Find in file contents
grep -r "function greet" src/

# Find and show line numbers
grep -rn "TODO" src/
```

---

## 🎯 Best Practices

### 1. Always Run from Project Root

```bash
# ✓ Correct
cd ~/projects/js-training
npm test

# ✗ Incorrect
cd ~/projects/js-training/src/01-javascript
npm test  # package.json won't be found
```

### 2. Use npx for Local Packages

```bash
# ✓ Correct (no global installation needed)
npx jest
npx ts-node script.ts

# ✗ Incorrect (clutters global space)
npm install -g jest
jest
```

### 3. Check Tests Before Commit

```bash
# Run all tests
npm test

# Check code quality
npm run lint

# Check TypeScript
npm run type-check

# If everything is OK - commit
git commit -m "Your message"
```

### 4. Use Watch Mode During Development

```bash
# Automatic test restart
npm test -- --watch

# In another terminal - edit code
code exercises/functions.js
```

---

## 📖 Additional Resources

- [Node.js Documentation](https://nodejs.org/docs/)
- [Jest CLI Options](https://jestjs.io/docs/cli)
- [VS Code Debugging](https://code.visualstudio.com/docs/editor/debugging)
- [npm scripts](https://docs.npmjs.com/cli/v10/using-npm/scripts)

---

**Previous:** [Development Tools](TOOLS.md)
**Next:** [Getting Started Guide](GETTING_STARTED.md)
