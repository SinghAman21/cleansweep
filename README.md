# cull - Enhanced Delete Script

A powerful and safe command-line tool for deleting files and folders with comprehensive safety features, logging, and flexible pattern matching.

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)
- [Safety Features](#safety-features)
- [Output Formats](#output-formats)
- [Logging](#logging)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)

## 🎯 Overview

cull is an enhanced bash script designed to safely and efficiently delete files and folders based on patterns, with multiple safety mechanisms to prevent accidental data loss. It provides features like dry-run mode, interactive confirmation, exclusion lists, depth control, and comprehensive logging.

## ✨ Features

### Core Capabilities

- **Pattern-Based Deletion**: Delete files and folders using glob patterns
- **Multiple Pattern Types**: Support for files, folders, and mixed types
- **Exclusion Lists**: Protect important files/folders from deletion
- **Depth Control**: Limit search depth in directory structures
- **Dry Run Mode**: Preview deletions without making changes
- **Interactive Mode**: Confirm each deletion individually
- **Preview Mode**: See what will be deleted before execution
- **Comprehensive Logging**: Track all operations with timestamps
- **Multiple Output Formats**: Plain text or JSON output
- **Force Mode**: Bypass safety checks when needed

### Safety Features

- ✅ Dry-run mode to preview changes
- ✅ Interactive confirmation prompts
- ✅ Exclusion pattern support
- ✅ Preview before deletion
- ✅ Comprehensive error handling
- ✅ Detailed logging with timestamps
- ✅ Summary reports after execution

## 📦 Installation

### Prerequisites

- Bash 4.0 or higher
- Standard Unix utilities (find, rm, date)

### Setup

1. Clone or download the script:
```bash
git clone <repository-url>
cd cull
```

2. Make the script executable:
```bash
chmod +x delete.sh
```

3. (Optional) Add to your PATH for global access:
```bash
sudo ln -s $(pwd)/delete.sh /usr/local/bin/cull
```

## 🚀 Usage

### Basic Syntax

```bash
./delete.sh [OPTIONS]
```

### Quick Start

```bash
# Preview what would be deleted (dry run)
./delete.sh --files "*.tmp" --dry-run

# Delete temporary files interactively
./delete.sh --files "*.tmp" --interactive

# Delete with logging
./delete.sh --files "*.log" --log cleanup.log
```

## 📖 Options

### Pattern Selection

| Option | Description | Example |
|--------|-------------|---------|
| `--files PATTERN` | Delete files matching pattern | `--files "*.tmp"` |
| `--folders PATTERN` | Delete folders matching pattern | `--folders "temp"` |
| `--types PATTERN` | Delete files/directories matching pattern | `--types "*.log"` |

### Safety & Control

| Option | Description |
|--------|-------------|
| `--dry-run` | Simulate deletion without actually deleting |
| `--interactive` | Prompt for confirmation before each deletion |
| `--preview` | Display list of items to be deleted |
| `--force` | Bypass safety checks and warnings |

### Filtering & Limits

| Option | Description | Example |
|--------|-------------|---------|
| `--exclude PATTERN` | Exclude patterns from deletion (can use multiple times) | `--exclude "important"` |
| `--depth NUMBER` | Limit search depth in directory structure | `--depth 2` |

### Output & Logging

| Option | Description | Example |
|--------|-------------|---------|
| `--log FILE` | Generate log file with timestamps | `--log deletion.log` |
| `--format FORMAT` | Output format: `plain` or `json` | `--format json` |
| `-h, --help` | Display help message | `--help` |

## 💡 Examples

### Example 1: Safe Cleanup with Preview

Delete temporary files with preview and logging:

```bash
./delete.sh --files "*.tmp" --preview --log cleanup.log --dry-run
```

**Output:**
```
[2024-01-15 10:30:00] [INFO] Starting deletion operation...
[2024-01-15 10:30:00] [INFO] Preview: Items that will be deleted (5 items):
  - ./cache/file1.tmp
  - ./cache/file2.tmp
  - ./logs/error.tmp
  - ./temp/data.tmp
  - ./tmp/backup.tmp
[2024-01-15 10:30:00] [INFO] Would delete: ./cache/file1.tmp
...
```

### Example 2: Interactive Deletion

Delete log files with confirmation prompts:

```bash
./delete.sh --types "*.log" --interactive --depth 2
```

**Interactive Prompt:**
```
Delete './logs/app.log'? [y/N]: y
[2024-01-15 10:31:00] [INFO] Deleted file: ./logs/app.log
Delete './logs/error.log'? [y/N]: n
[2024-01-15 10:31:05] [INFO] Skipped: ./logs/error.log
```

### Example 3: Exclude Important Files

Delete temporary files but exclude important directories:

```bash
./delete.sh --files "*.tmp" --exclude "important_folder" --exclude "backup" --log cleanup.log
```

### Example 4: Cleanup with Depth Limit

Delete cache folders up to 2 levels deep:

```bash
./delete.sh --folders "cache" --depth 2 --preview
```

### Example 5: JSON Output Format

Get output in JSON format for programmatic processing:

```bash
./delete.sh --files "*.tmp" --format json --dry-run
```

**Output:**
```json
{"timestamp":"2024-01-15 10:32:00","level":"INFO","message":"Starting deletion operation..."}
{"timestamp":"2024-01-15 10:32:00","level":"INFO","message":"Would delete: ./file.tmp"}
{"items":[{"path":"./file.tmp"}]}
```

### Example 6: Complex Cleanup

Multiple patterns with exclusions and logging:

```bash
./delete.sh \
  --files "*.tmp" \
  --folders "temp" \
  --exclude "important_folder" \
  --exclude "backup" \
  --log deletion_log.txt \
  --dry-run \
  --preview
```

### Example 7: Force Delete with Logging

Force delete without prompts (use with caution):

```bash
./delete.sh --folders "cache" --force --log cleanup.log
```

## 🛡️ Safety Features

### Dry Run Mode

Always test your deletion patterns with `--dry-run` first:

```bash
./delete.sh --files "*.tmp" --dry-run
```

This shows what would be deleted without actually deleting anything.

### Interactive Mode

Get confirmation for each item:

```bash
./delete.sh --files "*.tmp" --interactive
```

### Preview Mode

See all items before deletion:

```bash
./delete.sh --files "*.tmp" --preview
```

### Exclusion Patterns

Protect important files and folders:

```bash
./delete.sh --files "*.tmp" --exclude "important" --exclude "backup"
```

## 📊 Output Formats

### Plain Text (Default)

Human-readable output with timestamps and log levels:

```
[2024-01-15 10:30:00] [INFO] Starting deletion operation...
[2024-01-15 10:30:00] [INFO] Deleted file: ./file.tmp
```

### JSON Format

Machine-readable output for automation:

```json
{"timestamp":"2024-01-15 10:30:00","level":"INFO","message":"Deleted file: ./file.tmp"}
```

## 📝 Logging

### Log File Format

When using `--log`, the script creates a detailed log file:

```
==========================================
Deletion Log - 2024-01-15 10:30:00
==========================================
Dry Run: false
Interactive: true
Force: false
Files Pattern: *.tmp
Exclude Patterns: important backup
Max Depth: 2
==========================================

[2024-01-15 10:30:00] [INFO] Starting deletion operation...
[2024-01-15 10:30:01] [INFO] Deleted file: ./file1.tmp
[2024-01-15 10:30:02] [INFO] Deleted file: ./file2.tmp
```

### Log File Benefits

- Track all deletion operations
- Audit trail for compliance
- Debugging failed deletions
- Historical record of cleanup activities

## 🎯 Best Practices

### 1. Always Use Dry Run First

```bash
# Test your pattern first
./delete.sh --files "*.tmp" --dry-run
```

### 2. Use Preview Mode

```bash
# See what will be deleted
./delete.sh --files "*.tmp" --preview
```

### 3. Enable Logging

```bash
# Keep a record of deletions
./delete.sh --files "*.tmp" --log cleanup.log
```

### 4. Use Exclusion Patterns

```bash
# Protect important files
./delete.sh --files "*.tmp" --exclude "important" --exclude "backup"
```

### 5. Combine Safety Features

```bash
# Maximum safety
./delete.sh --files "*.tmp" --dry-run --preview --interactive --log cleanup.log
```

### 6. Limit Search Depth

```bash
# Avoid deep recursive searches
./delete.sh --files "*.tmp" --depth 3
```

## 🔧 Troubleshooting

### Issue: "No items found matching the specified patterns"

**Solution:** 
- Verify your pattern syntax (use quotes for patterns with wildcards)
- Check if files/folders exist in the current directory
- Try using `--preview` to see what matches

```bash
./delete.sh --files "*.tmp" --preview
```

### Issue: "Permission denied"

**Solution:**
- Check file/folder permissions
- Run with appropriate user permissions
- Some system files may require sudo (use with extreme caution)

### Issue: "Failed to delete" errors

**Solution:**
- Check if files are in use by other processes
- Verify write permissions
- Review the log file for detailed error information

### Issue: Pattern not matching expected files

**Solution:**
- Use `--dry-run` and `--preview` to test patterns
- Remember that patterns are glob patterns, not regex
- Use quotes around patterns: `--files "*.tmp"`

## 📋 Pattern Matching

### Supported Patterns

- `*.tmp` - All files ending with .tmp
- `temp*` - All items starting with "temp"
- `*cache*` - All items containing "cache"
- `temp` - Exact match for "temp"

### Pattern Examples

```bash
# Delete all temporary files
./delete.sh --files "*.tmp"

# Delete all log files
./delete.sh --files "*.log"

# Delete folders named "cache"
./delete.sh --folders "cache"

# Delete items matching multiple patterns
./delete.sh --types "*.tmp" --types "*.log"
```

## 🔄 Exit Codes

- `0` - Success (all deletions completed)
- `1` - Error (failed deletions or invalid arguments)

## 📄 Summary Report

After execution, the script provides a summary:

```
=== Deletion Summary ===
Total items found: 10
Items successfully deleted: 8
Failed deletions: 2
  - ./protected/file.tmp
  - ./locked/data.tmp
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues or pull requests.

## ⚠️ Warning

**Always use `--dry-run` and `--preview` before performing actual deletions. This script permanently deletes files and folders. Use with caution!**

## 📜 License

This script is provided as-is for educational and practical use. Use at your own risk.

## 🙏 Acknowledgments

Created as an enhanced deletion tool with safety features and comprehensive logging capabilities.

---

**Remember:** When in doubt, use `--dry-run` first! 🛡️

