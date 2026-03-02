# 🎓 Getting Started Guide

A detailed guide to get started with the training repository.

## 📋 Prerequisites

Before starting, make sure you have installed:

### 1. Node.js and npm

**Installation verification:**
```bash
node -v
npm -v
```

If not installed, download from [nodejs.org](https://nodejs.org/) (LTS version recommended).

### 2. Git

**Installation verification:**
```bash
git --version
```

If not installed, download from [git-scm.com](https://git-scm.com/).

### 3. Code Editor (VS Code Highly Recommended)

**We strongly recommend using Visual Studio Code for this course, even if you prefer other editors.**

#### Why VS Code?

This project is **pre-configured for VS Code** with:

✅ **Ready-to-use settings** - Formatting, linting, auto-save
✅ **Recommended extensions** - Installed automatically on first open
✅ **Debug configurations** - One-click debugging for JS/TS files and tests
✅ **Jest integration** - Run and debug tests directly from editor
✅ **TypeScript support** - Better error messages and IntelliSense

**Installation:**
- Download from [code.visualstudio.com](https://code.visualstudio.com/)
- Available for Windows, macOS, and Linux
- 100% free and open source

**First time opening the project in VS Code:**
```bash
code .
```

VS Code will show a notification in the bottom-right corner:
> "This workspace has extension recommendations"

Click **"Install All"** to automatically install all recommended extensions for the best experience.

Alternatively, you can:
- Click **"Show Recommendations"** to review extensions before installing
- Press `Cmd+Shift+X` (macOS) or `Ctrl+Shift+X` (Windows/Linux) and look for the "Recommended" section

**💡 Pro Tip: Enable Auto Save**

Auto-save is extremely useful when working with tests in watch mode:

1. Open VS Code settings: `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux)
2. Search for "auto save"
3. Set **"Files: Auto Save"** to `afterDelay` or `onFocusChange`

This way, your tests will automatically rerun when you stop typing, making development much faster!

<details>
<summary>📦 <strong>Pre-configured Extensions for This Course</strong></summary>

When you open this project in VS Code, you'll be prompted to install:

- **ESLint** - Code quality and error checking
- **Prettier** - Automatic code formatting
- **Jest Runner** - Run individual tests with one click
- **Jest** - IntelliSense for Jest tests
- **Pretty TypeScript Errors** - Better error messages
- **npm IntelliSense** - Auto-complete for npm modules

All these extensions are configured in `.vscode/extensions.json` and will make your learning experience much smoother.

</details>

**Can I use other editors?**

Yes, you can use WebStorm, Sublime, Vim, or any editor you prefer. The code will work fine, but you'll need to configure:
- ESLint integration manually
- Prettier formatting manually
- Debugger setup manually
- Jest test runner manually

## 🚀 Step-by-Step Instructions

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd js-training
```

### Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages (Jest, TypeScript, React, Express, etc.).

### Step 3: Verify Your Setup

**Check Node.js and npm installation:**

```bash
node -v
npm -v
```

✅ Expected: Node.js v22.x.x and npm v10.x.x (or higher)
❌ If not installed: See Prerequisites section above

<details>
<summary><strong>📋 Optional: Manual Environment Checklist</strong></summary>

If you want to verify everything manually:

**1. Verify Node.js installation**

```bash
node -v
```

✅ Expected: Should show version (e.g., `v22.x.x`)
❌ If not installed: Install via nvm or download from [nodejs.org](https://nodejs.org/)

---

**2. Verify npm installation**

```bash
npm -v
```

✅ Expected: Should show version (e.g., `10.x.x`)
❌ If not installed: Comes with Node.js, reinstall Node.js

---

**3. Verify Git installation**

```bash
git --version
```

✅ Expected: Should show version (e.g., `git version 2.39.0`)
❌ If not installed: Download from [git-scm.com](https://git-scm.com/)

---

**4. Check Git configuration**

```bash
git config user.name
git config user.email
```

✅ Expected: Should show your name and email
❌ If empty: Configure Git (see Step 4 below)

---

**5. Check if dependencies are installed**

```bash
ls node_modules
```

If folder doesn't exist or is empty:

```bash
npm install
```

✅ Expected: Should complete without errors
❌ If errors occur: Try `npm cache clean --force` and run again

---

**6. Optional: Run a quick test**

```bash
npm test -- --testPathPattern=01-variables --silent
```

✅ Expected: Should show test results (failures are OK at this point!)
❌ If command fails: Run `npm install` first

</details>

### Step 4: Configure Git (if needed)

If Git is not yet configured:

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Step 5: Create Your Own Branch

Create a separate branch for your work:

```bash
git checkout -b student/ivan
```

Replace `ivan` with your name. This will create a `student/ivan` branch where you'll work.

**Useful git commands:**
```bash
# Check current branch
git branch

# Switch to another branch
git checkout <branch-name>

# View all branches
git branch -a
```

💡 **More about Git:** [Git Branching](https://git-scm.com/book/en/v2/Git-Branching-Branches-in-a-Nutshell)

## 📖 How to Work with a Module

### Example: "Variables" Module

#### 1. Navigate to the Module

```bash
cd src/01-javascript/01-variables
```

#### 2. Read the README

```bash
cat README.md
# or open in editor
code README.md
```

README contains:
- Theoretical material
- Learning objectives
- Topic list
- Instructions

#### 3. Study the Examples

```bash
ls examples/
node examples/let-const.js
node examples/var-hoisting.js
```

Examples contain:
- Working code
- Detailed comments
- Console.log for result demonstration

**Tips:**
- Modify code in examples
- Experiment
- See what happens

#### 4. Complete the Exercises

Open `exercises/variables.js`:

```javascript
/**
 * TODO: Implement greet function
 * @param {string} name
 * @returns {string}
 */
function greet(name) {
  // Your code here
}
```

**Your task:**
- Read the JSDoc comment
- Write the code
- Follow the requirements

#### 5. Run Tests

```bash
# From project root folder
npm test -- 01-variables
```

Tests will show:
- ✓ Which tests passed
- ✗ Which tests failed
- Clear error messages

#### 6. Fix Errors

If tests fail:
1. Read the error message
2. Look at the test file in `__tests__/`
3. Understand what's expected
4. Fix the code
5. Run tests again

#### 7. Save Progress

When all tests pass:

```bash
git add exercises/variables.js
git commit -m "Completed 01-variables module"
```

## 🎯 Workflow

```
┌─────────────────────────────────────┐
│  1. Read module README              │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Run examples/                   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Write code in exercises/        │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Run tests                       │
└──────────────┬──────────────────────┘
               │
         ┌─────┴─────┐
         │           │
      Failed      Passed
         │           │
         ▼           ▼
       Fix       Commit
         │           │
         └─────┬─────┘
               │
               ▼
┌─────────────────────────────────────┐
│  Next module                        │
└─────────────────────────────────────┘
```

## 🧪 Working with Tests

### Running Tests

```bash
# All tests
npm test

# Specific module
npm test -- 01-variables
npm test -- functions

# Watch mode (auto-restart)
npm test -- --watch

# Verbose output
npm test -- --verbose

# Code coverage
npm run test:coverage
```

### Understanding Test Output

```
PASS  src/01-javascript/01-variables/__tests__/variables.test.js
  Variables Exercises
    greet function
      ✓ should return greeting with name (3 ms)
      ✓ should work with different names (1 ms)
    add function
      ✗ should add two numbers (5 ms)

  ● Variables Exercises › add function › should add two numbers

    expect(received).toBe(expected) // Object.is equality

    Expected: 5
    Received: undefined

      12 | describe('add function', () => {
      13 |   test('should add two numbers', () => {
    > 14 |     expect(add(2, 3)).toBe(5);
         |                       ^
      15 |   });
      16 | });
```

**What this means:**
- ✓ Test passed
- ✗ Test failed
- `Expected: 5` - what was expected
- `Received: undefined` - what was received
- Line 14 - where the error occurred

## 💡 Tips and Tricks

### 1. Enable Auto Save in VS Code

Auto-save is a game-changer when working with tests in watch mode!

**How to enable:**
1. `Cmd+,` (macOS) or `Ctrl+,` (Windows/Linux) to open settings
2. Search for "auto save"
3. Choose your preferred mode:
   - **`afterDelay`** - Saves automatically after you stop typing (recommended)
   - **`onFocusChange`** - Saves when you click outside the editor
   - **`onWindowChange`** - Saves when you switch to another app

**Why it's useful:**
- Works perfectly with Jest watch mode
- No need to press `Cmd+S` / `Ctrl+S` constantly
- Tests rerun automatically as you code
- Prevents forgetting to save before testing

### 2. Use Watch Mode During Development

```bash
npm test -- --watch
```

Tests automatically restart when files are saved. Combine with auto-save for the ultimate development experience!

### 2. Look at Tests as Specification

Files in `__tests__/` show exactly what's expected from your code.

### 3. Experiment with Examples

Modify code in `examples/`, add your own `console.log()`, break and fix.

### 4. Commit Often

Commit after each completed module. This allows you to:
- Track progress
- Return to previous versions
- See learning history

### 5. Don't Copy Code Blindly

Understand every line of code you write. If something is unclear - google it or ask your instructor.

### 6. Use the Debugger

This project is pre-configured with VS Code debug profiles. Set a breakpoint, press `F5`, and step through your code visually.

→ **[Full Debugging Guide](DEBUGGING.md)**

## 🐛 Common Issues

### Issue: Tests Don't Run

**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Issue: "Cannot find module"

**Solution:**
- Check that you're in the project root folder
- Run `npm install`
- Check the module path

### Issue: Git Commands Don't Work

**Solution:**
```bash
# Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
```

### Issue: Tests Pass Locally but Fail in CI

**Solution:**
- Make sure you've committed all changes
- Check that you're not using absolute paths
- Run `npm run lint` before committing

## 📚 Additional Resources

### JavaScript
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)
- [JavaScript.info](https://javascript.info/)
- [Eloquent JavaScript](https://eloquentjavascript.net/)

### TypeScript
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
- [TypeScript Deep Dive](https://basarat.gitbook.io/typescript/)

### Testing
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/docs/)

### React
- [React Documentation](https://react.dev/)
- [React Tutorial](https://react.dev/learn)

### Node.js
- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)

## 🆘 Getting Help

1. **Documentation** - Check the module README
2. **Examples** - Look at working code in examples/
3. **Tests** - Read tests to understand requirements
4. **Google** - Search for errors and concepts
5. **Instructor** - Ask if you're stuck

## ✅ Checklist Before Starting

- [ ] Node.js installed
- [ ] npm installed
- [ ] Git installed and configured
- [ ] Code editor installed
- [ ] `npm install` completed successfully
- [ ] Personal branch created
- [ ] Read this guide completely

---

**Ready to start? Navigate to the first module:**

```bash
cd src/01-javascript/01-variables
cat README.md
```

**Good luck with your learning! 🚀**
