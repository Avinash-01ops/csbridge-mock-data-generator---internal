# 🚀 Development and Build Instructions

## Available Scripts

### Development Mode

```bash
npm run dev
```

Starts the application in development mode with hot module replacement (HMR):
- Vite dev server for the React frontend
- Electron launches automatically
- Changes to React components update instantly
- Changes to Electron files require app restart

**Best for**: Active development and testing

---

### Production Build

```bash
npm run build
```

Creates a production-ready build:
1. Compiles TypeScript to JavaScript
2. Builds React app with Vite
3. Packages Electron application
4. Creates distributable files in `dist/` directory

**Output**: Platform-specific installers (exe, dmg, AppImage, etc.)

---

### Lint Check

```bash
npm run lint
```

Runs ESLint to check code quality:
- Checks TypeScript/TSX files
- Reports unused variables
- Enforces code style
- Shows warnings and errors

**Run before**: Committing code

---

### Preview Build

```bash
npm run preview
```

Previews the production build without creating installers:
- Tests production-optimized code
- Verifies build configuration
- Faster than full build

**Best for**: Testing production behavior

---

## Development Workflow

### 1. Initial Setup

```bash
# Install dependencies
npm install

# Verify installation
npm run dev
```

### 2. Daily Development

```bash
# Start dev server
npm run dev

# Make changes to files
# - src/*.tsx for UI changes
# - electron/*.ts for backend changes
# - src/*.css for styling

# Test changes immediately in running app
```

### 3. Testing

```bash
# Check for code issues
npm run lint

# Fix linting issues automatically (if possible)
npm run lint -- --fix
```

### 4. Building for Distribution

```bash
# Create production build
npm run build

# Find distributable files in dist/ folder
```

---

## Project Structure Explained

```
midtable-mock-data-app/
│
├── electron/                   # Electron (Node.js) backend
│   ├── main.ts                # Main process entry point
│   ├── preload.ts             # IPC bridge (secure)
│   └── dataGenerator.ts       # Data generation logic
│
├── src/                       # React frontend
│   ├── main.tsx               # React entry point
│   ├── App.tsx                # Main UI component
│   ├── App.css                # Styling
│   └── types.ts               # TypeScript definitions
│
├── public/                    # Static assets
│
├── dist/                      # Build output (gitignored)
│   ├── index.html             # Built HTML
│   ├── assets/                # Bundled JS/CSS
│   └── dist-electron/         # Compiled Electron code
│
├── package.json               # Dependencies and scripts
├── tsconfig.json              # TypeScript config (frontend)
├── tsconfig.node.json         # TypeScript config (backend)
├── vite.config.ts             # Vite bundler config
├── electron-builder.json5     # Electron packager config
├── schema.sql                 # Database schema
├── README.md                  # Main documentation
├── GUIDE.md                   # User guide
└── USAGE_EXAMPLE.md           # Usage examples
```

---

## File Changes and Hot Reload

### Auto-Reload (No Restart Needed)
- `src/App.tsx` - React component changes
- `src/App.css` - Style changes
- `src/types.ts` - Type definition changes

### Requires App Restart
- `electron/main.ts` - Main process changes
- `electron/preload.ts` - Preload script changes
- `electron/dataGenerator.ts` - Generator logic changes
- `package.json` - Dependency changes

---

## Debugging

### React DevTools

1. Open app with `npm run dev`
2. Right-click in app window
3. Select "Inspect Element"
4. Use React DevTools tab

### Console Logging

**Frontend (React)**:
```typescript
console.log('Frontend:', someVariable);
```
View in: Electron DevTools (Inspect Element)

**Backend (Electron)**:
```typescript
console.log('Backend:', someVariable);
```
View in: Terminal where you ran `npm run dev`

### Common Debug Tasks

**Check Database Connection**:
```typescript
// In electron/dataGenerator.ts
async testConnection(): Promise<boolean> {
  console.log('Testing connection with config:', this.pool.options);
  // ...
}
```

**Monitor Data Generation**:
```typescript
// Add in generateData method
console.log(`Generated event ${i + 1} of ${config.numberOfEvents}`);
```

---

## Troubleshooting Development Issues

### Issue: Port already in use

```bash
# Kill process on port 5173 (Vite default)
# Windows PowerShell:
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process

# Then restart:
npm run dev
```

### Issue: Node modules missing

```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

### Issue: TypeScript errors

```bash
# Check TypeScript compilation
npx tsc --noEmit

# Rebuild
npm run build
```

### Issue: Electron won't start

```bash
# Clear cache
npm run dev -- --force

# Or rebuild electron
npm rebuild electron
```

---

## Environment Variables

Create `.env` file for development settings (optional):

```env
# Database defaults
VITE_DB_HOST=localhost
VITE_DB_PORT=5432
VITE_DB_NAME=nphies_db
VITE_DB_USER=postgres
```

Access in React:
```typescript
const dbHost = import.meta.env.VITE_DB_HOST || 'localhost';
```

---

## Performance Tips

### Development
- Use `npm run dev` for fast feedback
- Enable React DevTools Profiler for performance analysis
- Monitor memory usage in Task Manager

### Production
- Run `npm run build` to test final performance
- Minified code is significantly faster
- Check bundle size in `dist/` folder

---

## Deployment

### Building for Windows

```bash
npm run build
# Output: dist/midtable-mock-data-app-1.0.0.exe
```

### Building for macOS

```bash
npm run build
# Output: dist/midtable-mock-data-app-1.0.0.dmg
```

### Building for Linux

```bash
npm run build
# Output: dist/midtable-mock-data-app-1.0.0.AppImage
```

### Distribution

1. Test the installer on target platform
2. Share the installer file (in `dist/` folder)
3. Users install like any desktop app
4. No npm/Node.js required for end users

---

## Advanced Configuration

### Electron Builder Options

Edit `electron-builder.json5`:
```json5
{
  appId: "com.nphies.mockdata",
  productName: "NPHIES Mock Data Generator",
  win: {
    target: ["nsis"],  // Windows installer type
    icon: "public/icon.ico"
  },
  mac: {
    target: ["dmg"],
    icon: "public/icon.icns"
  }
}
```

### Vite Configuration

Edit `vite.config.ts` for build optimization:
```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    sourcemap: false,  // Set true for debugging
    chunkSizeWarningLimit: 1000
  }
})
```

---

## Version Management

Update version in `package.json`:
```json
{
  "version": "1.0.0"
}
```

This version appears in:
- App title bar
- About dialog
- Installer filename

---

## Getting Help

1. **Vite issues**: https://vitejs.dev/guide/
2. **Electron issues**: https://www.electronjs.org/docs
3. **React issues**: https://react.dev/
4. **PostgreSQL issues**: https://node-postgres.com/

---

## Best Practices

✅ **Do**:
- Test database connection before generating data
- Start with small datasets (5-10 events)
- Keep dev server running for fast iteration
- Commit code regularly
- Run lint before committing

❌ **Don't**:
- Generate data on production databases during dev
- Ignore TypeScript errors
- Skip testing before building
- Modify node_modules directly
- Commit dist/ folder to git

---

**Happy Coding! 🎉**
