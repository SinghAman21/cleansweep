#!/bin/bash

###############################################################################
# Enhanced Delete Script
# 
# This script provides a comprehensive solution for deleting files and folders
# with multiple safety features, logging, and customization options.
###############################################################################

# Global variables
DRY_RUN=false
INTERACTIVE=false
FORCE=false
PREVIEW=false
LOG_FILE=""
OUTPUT_FORMAT="plain"
MAX_DEPTH=""
FILES_PATTERN=""
FOLDERS_PATTERN=""
TYPES_PATTERN=""
EXCLUDE_PATTERNS=()
ITEMS_TO_DELETE=()
DELETED_ITEMS=()
FAILED_DELETIONS=()

###############################################################################
# Function: print_usage
# Description: Displays the usage information and available options for the script
###############################################################################
print_usage() {
    cat << EOF
Usage: $0 [OPTIONS]

Options:
    --files | -fi PATTERN          Specify file patterns to delete (e.g., "*.tmp", "*.log")
    --folders | -fo PATTERN        Specify folder patterns to delete (e.g., "temp", "cache")
    --types | -ty PATTERN          Specify multiple types of files/directories to delete
    --exclude | -ex PATTERN        Exclude patterns or folders from deletion (can be used multiple times)
    --depth | -d NUMBER           Limit the search depth in directory structure
    --dry-run | -dr                Simulate deletion without actually deleting anything
    --interactive | -in            Prompt for confirmation before each deletion
    --preview | -pr                Display list of items that will be deleted
    --force | -f                  Bypass safety checks and interactive warnings
    --log | -lg FILE               Generate a log file with timestamps of deletions
    --format | -fm FORMAT          Output format: plain, json (default: plain)
    -h, --help               Display this help message

Examples:
    $0 --files "*.tmp" --folders "temp" --exclude "important" --log deletion_log.txt --dry-run
    $0 --types "*.log" --depth 2 --interactive
    $0 --files "*.tmp" --preview
    $0 --folders "cache" --force --log cleanup.log

EOF
}

###############################################################################
# Function: log_message
# Description: Logs a message with timestamp to both console and log file (if specified)
# Parameters:
#   $1 - Message to log
#   $2 - Log level (INFO, WARNING, ERROR)
###############################################################################
log_message() {
    local message="$1"
    local level="${2:-INFO}"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    local formatted_message="[$timestamp] [$level] $message"
    
    # Print to console
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        echo "{\"timestamp\":\"$timestamp\",\"level\":\"$level\",\"message\":\"$message\"}"
    else
        echo "$formatted_message"
    fi
    
    # Write to log file if specified
    if [ -n "$LOG_FILE" ]; then
        echo "$formatted_message" >> "$LOG_FILE"
    fi
}

###############################################################################
# Function: parse_arguments
# Description: Parses command-line arguments and sets global configuration variables
###############################################################################
parse_arguments() {
    while [[ $# -gt 0 ]]; do
        case $1 in
            --files | -fi)
                FILES_PATTERN="$2"
                shift 2
                ;;
            --folders | -fo)
                FOLDERS_PATTERN="$2"
                shift 2
                ;;
            --types | -ty)
                TYPES_PATTERN="$2"
                shift 2
                ;;
            --exclude | -ex)
                EXCLUDE_PATTERNS+=("$2")
                shift 2
                ;;
            --depth | -d)
                MAX_DEPTH="$2"
                if ! [[ "$MAX_DEPTH" =~ ^[0-9]+$ ]]; then
                    log_message "Error: --depth must be a positive number" "ERROR"
                    exit 1
                fi
                shift 2
                ;;
            --dry-run | -dr)
                DRY_RUN=true
                shift
                ;;
            --interactive | -in)
                INTERACTIVE=true
                shift
                ;;
            --preview | -pr)
                PREVIEW=true
                shift
                ;;
            --force | -f)
                FORCE=true
                shift
                ;;
            --log | -lg)
                LOG_FILE="$2"
                shift 2
                ;;
            --format | -fm)
                OUTPUT_FORMAT="$2"
                if [[ ! "$OUTPUT_FORMAT" =~ ^(plain|json)$ ]]; then
                    log_message "Error: --format must be 'plain' or 'json'" "ERROR"
                    exit 1
                fi
                shift 2
                ;;
            -h|--help)
                print_usage
                exit 0
                ;;
            *)
                log_message "Unknown option: $1" "ERROR"
                print_usage
                exit 1
                ;;
        esac
    done
    
    # Validate that at least one pattern is specified
    if [ -z "$FILES_PATTERN" ] && [ -z "$FOLDERS_PATTERN" ] && [ -z "$TYPES_PATTERN" ]; then
        log_message "Error: At least one of --files, --folders, or --types must be specified" "ERROR"
        print_usage
        exit 1
    fi
}

###############################################################################
# Function: should_exclude
# Description: Checks if a given path should be excluded based on exclusion patterns
# Parameters:
#   $1 - Path to check
# Returns: 0 if should be excluded, 1 otherwise
###############################################################################
should_exclude() {
    local path="$1"
    
    for pattern in "${EXCLUDE_PATTERNS[@]}"; do
        # Check if path matches the exclusion pattern
        if [[ "$path" == *"$pattern"* ]] || [[ "$(basename "$path")" == "$pattern" ]]; then
            return 0  # Should be excluded
        fi
    done
    
    return 1  # Should not be excluded
}

###############################################################################
# Function: build_find_command
# Description: Constructs the find command with appropriate options based on patterns and depth
# Parameters:
#   $1 - Type of item to find ("f" for files, "d" for directories)
#   $2 - Pattern to match
# Returns: The constructed find command as a string
###############################################################################
build_find_command() {
    local item_type="$1"
    local pattern="$2"
    local find_cmd="find ."
    
    # Add depth limit if specified
    if [ -n "$MAX_DEPTH" ]; then
        find_cmd="$find_cmd -maxdepth $MAX_DEPTH"
    fi
    
    # Add type filter
    find_cmd="$find_cmd -type $item_type"
    
    # Add name pattern
    find_cmd="$find_cmd -name \"$pattern\""
    
    echo "$find_cmd"
}

###############################################################################
# Function: collect_items_to_delete
# Description: Collects all items (files/folders) that match the specified patterns
#              and stores them in the ITEMS_TO_DELETE array
###############################################################################
collect_items_to_delete() {
    ITEMS_TO_DELETE=()
    
    # Process file patterns
    if [ -n "$FILES_PATTERN" ]; then
        while IFS= read -r -d '' item; do
            if ! should_exclude "$item"; then
                ITEMS_TO_DELETE+=("$item")
            fi
        done < <(eval "$(build_find_command "f" "$FILES_PATTERN")" -print0 2>/dev/null)
    fi
    
    # Process folder patterns
    if [ -n "$FOLDERS_PATTERN" ]; then
        while IFS= read -r -d '' item; do
            if ! should_exclude "$item"; then
                ITEMS_TO_DELETE+=("$item")
            fi
        done < <(eval "$(build_find_command "d" "$FOLDERS_PATTERN")" -print0 2>/dev/null)
    fi
    
    # Process types pattern (can match both files and directories)
    if [ -n "$TYPES_PATTERN" ]; then
        while IFS= read -r -d '' item; do
            if ! should_exclude "$item"; then
                ITEMS_TO_DELETE+=("$item")
            fi
        done < <(eval "find . ${MAX_DEPTH:+-maxdepth $MAX_DEPTH} -name \"$TYPES_PATTERN\"" -print0 2>/dev/null)
    fi
    
    # Remove duplicates
    IFS=$'\n' ITEMS_TO_DELETE=($(printf '%s\n' "${ITEMS_TO_DELETE[@]}" | sort -u))
}

###############################################################################
# Function: display_preview
# Description: Displays a preview of all items that will be deleted
###############################################################################
display_preview() {
    if [ ${#ITEMS_TO_DELETE[@]} -eq 0 ]; then
        log_message "No items found matching the specified patterns." "INFO"
        return
    fi
    
    log_message "Preview: Items that will be deleted (${#ITEMS_TO_DELETE[@]} items):" "INFO"
    
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        echo -n "{\"items\":["
        local first=true
        for item in "${ITEMS_TO_DELETE[@]}"; do
            if [ "$first" = true ]; then
                first=false
            else
                echo -n ","
            fi
            echo -n "{\"path\":\"$item\"}"
        done
        echo "]}"
    else
        for item in "${ITEMS_TO_DELETE[@]}"; do
            echo "  - $item"
        done
    fi
}

###############################################################################
# Function: confirm_deletion
# Description: Prompts the user for confirmation before deleting an item
# Parameters:
#   $1 - Path of the item to delete
# Returns: 0 if confirmed, 1 if not confirmed
###############################################################################
confirm_deletion() {
    local item="$1"
    
    if [ "$FORCE" = true ]; then
        return 0  # Force mode, always confirm
    fi
    
    echo -n "Delete '$item'? [y/N]: "
    read -r response
    case "$response" in
        [yY][eE][sS]|[yY])
            return 0
            ;;
        *)
            return 1
            ;;
    esac
}

###############################################################################
# Function: delete_item
# Description: Deletes a single item (file or directory) with appropriate logging
# Parameters:
#   $1 - Path of the item to delete
###############################################################################
delete_item() {
    local item="$1"
    
    # Skip if dry run
    if [ "$DRY_RUN" = true ]; then
        log_message "Would delete: $item" "INFO"
        DELETED_ITEMS+=("$item")
        return 0
    fi
    
    # Interactive confirmation
    if [ "$INTERACTIVE" = true ]; then
        if ! confirm_deletion "$item"; then
            log_message "Skipped: $item" "INFO"
            return 0
        fi
    fi
    
    # Perform deletion
    if [ -d "$item" ]; then
        if rm -rf "$item" 2>/dev/null; then
            log_message "Deleted directory: $item" "INFO"
            DELETED_ITEMS+=("$item")
        else
            log_message "Failed to delete directory: $item" "ERROR"
            FAILED_DELETIONS+=("$item")
        fi
    elif [ -f "$item" ]; then
        if rm -f "$item" 2>/dev/null; then
            log_message "Deleted file: $item" "INFO"
            DELETED_ITEMS+=("$item")
        else
            log_message "Failed to delete file: $item" "ERROR"
            FAILED_DELETIONS+=("$item")
        fi
    else
        log_message "Item not found or already deleted: $item" "WARNING"
    fi
}

###############################################################################
# Function: process_deletions
# Description: Processes all collected items for deletion based on the current mode
###############################################################################
process_deletions() {
    if [ ${#ITEMS_TO_DELETE[@]} -eq 0 ]; then
        log_message "No items to delete." "INFO"
        return
    fi
    
    # Show preview if requested
    if [ "$PREVIEW" = true ]; then
        display_preview
        if [ "$DRY_RUN" = false ] && [ "$FORCE" = false ]; then
            echo -n "Proceed with deletion? [y/N]: "
            read -r response
            case "$response" in
                [yY][eE][sS]|[yY])
                    ;;
                *)
                    log_message "Deletion cancelled by user." "INFO"
                    exit 0
                    ;;
            esac
        fi
    fi
    
    # Process each item
    for item in "${ITEMS_TO_DELETE[@]}"; do
        delete_item "$item"
    done
}

###############################################################################
# Function: print_summary
# Description: Displays a summary of the deletion operation including statistics
###############################################################################
print_summary() {
    local total_items=${#ITEMS_TO_DELETE[@]}
    local deleted_count=${#DELETED_ITEMS[@]}
    local failed_count=${#FAILED_DELETIONS[@]}
    
    if [ "$OUTPUT_FORMAT" = "json" ]; then
        echo "{"
        echo "  \"summary\": {"
        echo "    \"total_items\": $total_items,"
        echo "    \"deleted\": $deleted_count,"
        echo "    \"failed\": $failed_count,"
        echo "    \"dry_run\": $DRY_RUN"
        echo "  }"
        if [ $failed_count -gt 0 ]; then
            echo "  \"failed_items\": ["
            local first=true
            for item in "${FAILED_DELETIONS[@]}"; do
                if [ "$first" = true ]; then
                    first=false
                else
                    echo ","
                fi
                echo -n "    {\"path\":\"$item\"}"
            done
            echo ""
            echo "  ]"
        fi
        echo "}"
    else
        log_message "=== Deletion Summary ===" "INFO"
        log_message "Total items found: $total_items" "INFO"
        if [ "$DRY_RUN" = true ]; then
            log_message "Items that would be deleted: $deleted_count" "INFO"
        else
            log_message "Items successfully deleted: $deleted_count" "INFO"
        fi
        if [ $failed_count -gt 0 ]; then
            log_message "Failed deletions: $failed_count" "ERROR"
            for item in "${FAILED_DELETIONS[@]}"; do
                log_message "  - $item" "ERROR"
            done
        fi
    fi
}

###############################################################################
# Function: initialize_log_file
# Description: Initializes the log file if logging is enabled
###############################################################################
initialize_log_file() {
    if [ -n "$LOG_FILE" ]; then
        # Create log file with header
        {
            echo "=========================================="
            echo "Deletion Log - $(date '+%Y-%m-%d %H:%M:%S')"
            echo "=========================================="
            echo "Dry Run: $DRY_RUN"
            echo "Interactive: $INTERACTIVE"
            echo "Force: $FORCE"
            [ -n "$FILES_PATTERN" ] && echo "Files Pattern: $FILES_PATTERN"
            [ -n "$FOLDERS_PATTERN" ] && echo "Folders Pattern: $FOLDERS_PATTERN"
            [ -n "$TYPES_PATTERN" ] && echo "Types Pattern: $TYPES_PATTERN"
            [ ${#EXCLUDE_PATTERNS[@]} -gt 0 ] && echo "Exclude Patterns: ${EXCLUDE_PATTERNS[*]}"
            [ -n "$MAX_DEPTH" ] && echo "Max Depth: $MAX_DEPTH"
            echo "=========================================="
            echo ""
        } > "$LOG_FILE"
    fi
}

###############################################################################
# Main execution flow
###############################################################################
main() {
    # Parse command-line arguments
    parse_arguments "$@"
    
    # Initialize log file
    initialize_log_file
    
    # Log start of operation
    log_message "Starting deletion operation..." "INFO"
    
    # Collect items to delete
    collect_items_to_delete
    
    # Process deletions
    process_deletions
    
    # Print summary
    print_summary
    
    # Exit with appropriate code
    if [ ${#FAILED_DELETIONS[@]} -gt 0 ]; then
        exit 1
    else
        exit 0
    fi
}

# Run main function with all arguments
main "$@"
