# 🚀 Fullstack JavaScript/TypeScript Training

Welcome to hands-on fullstack development training! Learn JavaScript, TypeScript, Node.js Backend, and React Frontend through practical examples.

## 🎯 What You'll Learn

- **JavaScript Basics** - Variables, data types, functions, arrays, objects, control flow, async, strings, error handling, classes, closures, JSON & modules
- **TypeScript** - Coming soon
- **Tests** - Coming soon
- **Backend Projects** - Coming soon
- **Frontend Projects** - Coming soon

<details>
<summary>📋 <strong>View Complete Course Structure</strong></summary>

### 1. JavaScript Basics
- **Variables** (`01-variables`) - `let`, `const`, `var`, hoisting, scope
- **Data Types** (`02-data-types`) - Primitives, type conversion, `typeof`, truthy/falsy
- **Control Flow** (`03-control-flow`) - `if/else`, `switch`, ternary, loops
- **Strings** (`04-strings`) - String methods, template literals, search, transform
- **Functions** (`05-functions`) - Declarations, expressions, arrow functions, higher-order, callbacks
- **Arrays** (`06-arrays`) - Array methods, `map/filter/reduce`, iteration
- **Objects** (`07-objects`) - Literals, methods, destructuring, spread operator
- **Error Handling** (`08-error-handling`) - `try/catch/finally`, custom errors, error types
- **Classes** (`09-classes`) - `class`, inheritance, static, private fields, `instanceof`
- **Closures** (`10-closures`) - Lexical scope, factory functions, memoization, module pattern
- **Async** (`11-async`) - Callbacks, promises, `async/await`, error handling
- **JSON & Modules** (`12-json-modules`) - `JSON.parse/stringify`, `import/export`, CommonJS vs ESM

### 2. TypeScript Basics
_Coming soon - folders created but content pending_

### 3. Tests
_Coming soon - separate section for testing concepts_

### 4. Backend Projects
_Coming soon - practical Node.js/Express projects_

### 5. Frontend Projects
_Coming soon - practical React projects_

</details>

## 📊 Evaluation Format

Each block includes:
- **Study materials**: README, examples, exercises
- **Evaluation**: Control questions per topic
- **Requirement**: Must complete previous block before starting next

## 🚀 Getting Started

### What You're Learning

**JavaScript** is the language of the web - originally created in 1995 for browsers, it's now one of the most popular programming languages in the world. You'll find JavaScript running:
- 🌐 **In browsers** - Making websites interactive (React, Vue, Angular)
- 🖥️ **On servers** - Building APIs and backend systems (Node.js, Express)
- 📱 **In mobile apps** - React Native, Ionic
- 🖨️ **In desktop apps** - Electron (VS Code, Slack, Discord)
- 🤖 **In IoT devices** - Embedded systems, robotics

**Node.js** is a JavaScript runtime built on Chrome's V8 engine. It lets you run JavaScript outside the browser - on servers, in build tools, anywhere! Released in 2009, Node.js transformed JavaScript from a browser-only language into a full-stack powerhouse.

**TypeScript** adds static typing to JavaScript, catching errors before your code runs. Created by Microsoft in 2012, it's become the industry standard for large-scale applications.

**Why this stack?**
- ✅ One language for frontend and backend
- ✅ Huge ecosystem (npm has 2+ million packages)
- ✅ Modern, actively developed
- ✅ High demand in job market

**Want to learn more?**
- [JavaScript: The First 20 Years](https://dl.acm.org/doi/10.1145/3386327) - History and evolution
- [How JavaScript Works](https://developer.mozilla.org/en-US/docs/Web/JavaScript) - MDN Web Docs
- [Node.js: Under the Hood](https://nodejs.org/en/learn/getting-started/introduction-to-nodejs) - Official docs

---

### Prerequisites

**You'll need Node.js and npm installed.**

**Recommended setup with nvm:**

```bash
# Install nvm (Node Version Manager)
# macOS/Linux:
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Windows: Download from https://github.com/coreybutler/nvm-windows/releases

# After installation, restart terminal and run:
nvm install 22
nvm use 22
nvm alias default 22  # Set as default version
node -v  # Should show v22.x.x
```

**Why nvm?**
- 🔄 Switch between Node.js versions easily
- 🎯 Use latest stable version (Node.js 22 LTS)
- 🚀 Avoid permission issues

**Alternative:** Download Node.js directly from [nodejs.org](https://nodejs.org/) - get version 22.x LTS

**New to these tools?** → **[Development Tools Guide](docs/TOOLS.md)** explains Node.js, npm, npx, nvm in detail

---

### Setup (2 minutes)

**1. Install dependencies if you not done that before**
```bash
npm install
```

**2. Create your student branch:**
Create your own branch to keep your work separate and safe.

```bash
git checkout -b student/<your-name>
```

✅ **You're ready to start learning!**

---

## 📚 Your Learning Workflow

This is your step-by-step process for each block topic:

### Step 1: Read the Theory

Navigate to a topic and read its README:

```bash
cd src/01-javascript/01-variables
cat README.md
```

Each README contains:
- Quick overview of concepts
- Key topics explained
- Links to external resources (MDN, JavaScript.info)

### Step 2: Study the Examples

Run working examples to see concepts in action:

```bash
node examples/let-const.js
node examples/scope.js
node examples/var-hoisting.js
```

Examples show real code with output - experiment with them!

**Need help running scripts?** → **[Running Scripts Guide](docs/RUNNING_SCRIPTS.md)**

### Step 3: Complete the Exercises

Open exercise files in your editor and write code:

```bash
code exercises/variables.js
```

Exercises have TODOs for you to complete. Run them to test your solutions.

### Step 4: Prepare for Evaluation

- Prepare answers with code examples
- You'll get 2 random questions during evaluation

### Step 5: Commit Your Progress

Save your completed work:

```bash
cd ../../..  # Back to project root
git add .
git commit -m "Completed block 1: Variables"
```

### Step 6: Move to Next Block

**Important:** Complete the current block's evaluation before starting the next topic. Topics build on each other!

---

## 🛠 Quick Command Reference

**Running Examples:**
```bash
node src/01-javascript/01-variables/examples/let-const.js
node src/01-javascript/03-control-flow/examples/conditionals.js
```

**Code Quality:**
```bash
npm run lint                # Check code style
npm run lint:fix            # Auto-fix issues
npm run type-check          # TypeScript validation
```

---

## 📖 Documentation & Resources

### Course Documentation

- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Detailed setup and first steps
- **[Development Tools](docs/TOOLS.md)** - Node.js, npm, npx, nvm, ts-node explained
- **[Running Scripts](docs/RUNNING_SCRIPTS.md)** - How to run and debug your code

### External Resources

- [MDN Web Docs](https://developer.mozilla.org/) - JavaScript reference
- [TypeScript Handbook](https://www.typescriptlang.org/docs/) - TypeScript documentation
- [React Documentation](https://react.dev/) - React official docs
- [Jest Documentation](https://jestjs.io/) - Testing framework docs

---

## 💡 Learning Tips

1. **One block, one topic** - Complete topics in order, each builds on the last
2. **Questions** - You'll get 2 random questions in evaluation
3. **Run examples** - Don't just read, execute and modify code
4. **Complete exercises** - Practice makes perfect
5. **Prepare code examples** - Be ready to write code during evaluation
6. **Review before evaluation** - Go through examples and exercises again
7. **Don't skip topics** - Sequential completion is mandatory

---

## 🤝 Need Help?

1. Check **[Getting Started Guide](docs/GETTING_STARTED.md)** for setup issues
2. Review the **module's README** for theory
3. Study **examples/** in the module folder
4. Read **[Running Scripts Guide](docs/RUNNING_SCRIPTS.md)** for execution help
5. Contact your instructor

## 📜 License

MIT

---

**Happy learning! 🎓✨**
