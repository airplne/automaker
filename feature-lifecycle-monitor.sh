#!/bin/bash

# Feature Lifecycle State Monitor
# Watches feature.json files for status changes
# Runs every 10 seconds for 10 minutes (60 iterations)

FEATURES_DIR="/home/aip0rt/Desktop/automaker/.automaker/features"
ITERATIONS=60
INTERVAL=10
STUCK_THRESHOLD=120  # 2 minutes considered "stuck"

declare -A LAST_STATUS
declare -A LAST_CHANGE_TIME
declare -A TASKS_COMPLETED
declare -A TASKS_TOTAL

log_transition() {
    local feature_id="$1"
    local old_status="$2"
    local new_status="$3"
    local timestamp="$4"
    local tasks_info="$5"

    echo "[$timestamp] TRANSITION: $feature_id"
    echo "  Status: $old_status -> $new_status"
    if [ -n "$tasks_info" ]; then
        echo "  Tasks: $tasks_info"
    fi
    echo ""
}

log_stuck() {
    local feature_id="$1"
    local status="$2"
    local seconds_stuck="$3"
    local timestamp="$4"

    echo "[$timestamp] WARNING - STUCK: $feature_id"
    echo "  Status: $status (stuck for ${seconds_stuck}s)"
    echo ""
}

check_features() {
    local current_time=$(date +%s)
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')

    # Find all feature.json files
    if [ ! -d "$FEATURES_DIR" ]; then
        echo "[$timestamp] Features directory not found: $FEATURES_DIR"
        return
    fi

    for feature_dir in "$FEATURES_DIR"/*; do
        if [ -d "$feature_dir" ]; then
            local feature_json="$feature_dir/feature.json"
            if [ -f "$feature_json" ]; then
                local feature_id=$(basename "$feature_dir")

                # Read status from JSON
                local status=$(jq -r '.status // "unknown"' "$feature_json" 2>/dev/null)
                local updated_at=$(jq -r '.updatedAt // ""' "$feature_json" 2>/dev/null)
                local tasks_completed=$(jq -r '.planSpec.tasksCompleted // ""' "$feature_json" 2>/dev/null)
                local tasks_total=$(jq -r '.planSpec.tasksTotal // ""' "$feature_json" 2>/dev/null)
                local wizard_status=$(jq -r '.wizard.status // ""' "$feature_json" 2>/dev/null)
                local planning_mode=$(jq -r '.planningMode // ""' "$feature_json" 2>/dev/null)

                # Build tasks info string
                local tasks_info=""
                if [ -n "$tasks_completed" ] && [ "$tasks_completed" != "null" ] && [ -n "$tasks_total" ] && [ "$tasks_total" != "null" ]; then
                    tasks_info="$tasks_completed/$tasks_total completed"
                fi

                # Check for status change
                local prev_status="${LAST_STATUS[$feature_id]:-}"
                if [ -z "$prev_status" ]; then
                    # First time seeing this feature
                    echo "[$timestamp] DISCOVERED: $feature_id"
                    echo "  Current status: $status"
                    echo "  Planning mode: $planning_mode"
                    if [ -n "$wizard_status" ] && [ "$wizard_status" != "null" ]; then
                        echo "  Wizard status: $wizard_status"
                    fi
                    if [ -n "$tasks_info" ]; then
                        echo "  Tasks: $tasks_info"
                    fi
                    if [ -n "$updated_at" ] && [ "$updated_at" != "null" ]; then
                        echo "  Last updated: $updated_at"
                    fi
                    echo ""
                    LAST_STATUS[$feature_id]="$status"
                    LAST_CHANGE_TIME[$feature_id]=$current_time
                    TASKS_COMPLETED[$feature_id]="$tasks_completed"
                    TASKS_TOTAL[$feature_id]="$tasks_total"
                elif [ "$status" != "$prev_status" ]; then
                    # Status changed
                    log_transition "$feature_id" "$prev_status" "$status" "$timestamp" "$tasks_info"
                    LAST_STATUS[$feature_id]="$status"
                    LAST_CHANGE_TIME[$feature_id]=$current_time
                else
                    # Check if task progress changed
                    local prev_tasks="${TASKS_COMPLETED[$feature_id]:-}"
                    if [ -n "$tasks_completed" ] && [ "$tasks_completed" != "null" ] && [ "$tasks_completed" != "$prev_tasks" ]; then
                        echo "[$timestamp] PROGRESS: $feature_id"
                        echo "  Tasks: $tasks_info"
                        echo ""
                        TASKS_COMPLETED[$feature_id]="$tasks_completed"
                        LAST_CHANGE_TIME[$feature_id]=$current_time
                    fi

                    # Check if stuck
                    local last_change="${LAST_CHANGE_TIME[$feature_id]:-$current_time}"
                    local time_in_state=$((current_time - last_change))
                    if [ $time_in_state -ge $STUCK_THRESHOLD ]; then
                        # Only warn once per threshold period
                        if [ $((time_in_state % STUCK_THRESHOLD)) -lt $INTERVAL ]; then
                            log_stuck "$feature_id" "$status" "$time_in_state" "$timestamp"
                        fi
                    fi
                fi

                TASKS_TOTAL[$feature_id]="$tasks_total"
            fi
        fi
    done
}

# Main monitoring loop
echo "=========================================="
echo "Feature Lifecycle State Monitor"
echo "=========================================="
echo "Started at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "Monitoring: $FEATURES_DIR"
echo "Duration: $((ITERATIONS * INTERVAL)) seconds ($ITERATIONS checks)"
echo "Check interval: ${INTERVAL}s"
echo "Stuck threshold: ${STUCK_THRESHOLD}s"
echo ""
echo "Watching for transitions:"
echo "  - backlog -> in_progress"
echo "  - in_progress -> waiting_approval (planning mode)"
echo "  - waiting_approval -> in_progress (after approval)"
echo "  - in_progress -> completed"
echo "  - Any other status changes"
echo "=========================================="
echo ""

# Initial scan
check_features

# Monitor loop
for ((i=1; i<=ITERATIONS; i++)); do
    sleep $INTERVAL
    echo "--- Check $i/$ITERATIONS at $(date '+%H:%M:%S') ---"
    check_features
done

echo ""
echo "=========================================="
echo "Monitoring Complete"
echo "Ended at: $(date '+%Y-%m-%d %H:%M:%S')"
echo "=========================================="

# Final summary
echo ""
echo "Final Feature States:"
for feature_id in "${!LAST_STATUS[@]}"; do
    echo "  $feature_id: ${LAST_STATUS[$feature_id]}"
done
