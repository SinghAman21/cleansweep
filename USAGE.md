# cull Usage Guide

## Installation

### Using npx (Recommended - No Installation Required)

```bash
npx cull --files "*.tmp" --dry-run
```

### Local Installation

```bash
npm install
npm run build
npm start -- --files "*.tmp" --dry-run
```

### Global Installation

```bash
npm install -g .
cull --files "*.tmp" --dry-run
```

## Quick Examples

### Dry Run (Safe Testing)
```bash
npx cull --files "*.tmp" --dry-run
```

### Preview Before Deletion
```bash
npx cull --files "*.tmp" --preview
```

### Interactive Deletion
```bash
npx cull --files "*.log" --interactive
```

### Delete with Logging
```bash
npx cull --files "*.tmp" --log cleanup.log
```

### Multiple Patterns with Exclusions
```bash
npx cull --files "*.tmp" --folders "temp" --exclude "important" --exclude "backup" --dry-run
```

### Limited Depth Search
```bash
npx cull --folders "cache" --depth 2 --preview
```

### JSON Output Format
```bash
npx cull --files "*.tmp" --format json --dry-run
```

## Development

### Build TypeScript
```bash
npm run build
```

### Run in Development Mode
```bash
npm run dev -- --files "*.tmp" --dry-run
```

## Notes

- Always use `--dry-run` first to test your patterns
- Use `--preview` to see what will be deleted
- Combine `--dry-run` and `--preview` for maximum safety
- The TypeScript version provides the same functionality as the bash script

