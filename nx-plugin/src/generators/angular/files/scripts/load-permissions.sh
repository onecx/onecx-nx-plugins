#!/bin/bash

# ANSI color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Relative paths to values.yaml and Chart.yaml
values_file="helm/values.yaml"
chart_file="helm/Chart.yaml"

# Function to print success, error and warning messages
print_success() {
    echo -e "\n${GREEN}$1${NC}"
}

print_error() {
    echo -e "\n${RED}$1${NC}"
}

print_warning() {
    echo -e "\n${YELLOW}$1${NC}"
}

# Function to get or save the token
get_or_save_token() {
    # The token gets saved to a temporary directory to make it more convenient if you have to execute the script multiple times
    # The folder should be ignored by git and therefore not publish your key to github
    local token_dir="scripts/.project"
    local token_file="$token_dir/token.txt"
    
    # Create .local directory if it doesn't exist
    if [ ! -d "$token_dir" ]; then
        mkdir "$token_dir"
        print_success "Created $token_dir directory"
    fi

    if [ -f "$token_file" ]; then
        apm_principal_token=$(cat "$token_file")
        print_success "Token loaded from $token_file"
        print_warning "If the connection to the Database cant be established, remove as a first debugging step the $token_file in the directory $token_dir"
    else
        
        read -p "Please enter your apm-principal-token: " apm_principal_token
        if [ -z "$apm_principal_token" ]; then
            print_error "Error: apm-principal-token cannot be empty."
            exit 1
        fi
        # echo "$apm_principal_token" > "$token_file"
        # print_success "Token saved to $token_file"
    fi
    print_success "apm-principal-token received."
}

# Function to extract app ID and product name
extract_app_id_and_product_name() {
    app_id=$(sed -n '2 s/^name: \([^ ]*\).*/\1/p' "$chart_file")
    app_name=$(sed -n '4 s/description: //p' "$chart_file")
    product_name=$(echo "$app_id" | sed 's/-ui$//')
    
    app_id="${app_id}"
    
    print_success "=> app id: $app_id"
    print_success "=> app name: $app_name"
    print_success "=> product name: $product_name"
}

# Function to find permissions
find_permissions() {
    array=()
    while IFS= read -r line; do
        if [[ "$line" == *"permissions:"* ]]; then
            permissions_spaces=$(echo "$line" | grep -oE '^[[:space:]]*' | wc -c)

            while IFS= read -r next_line; do
                next_spaces=$(echo "$next_line" | grep -oE '^[[:space:]]*' | wc -c)

                if (( next_spaces <= permissions_spaces )); then
                    break
                fi
                if (( next_spaces == permissions_spaces + 2 )); then
                    current_key=$(echo "$next_line" | tr -d ':' | tr -d ' ')
                elif (( next_spaces == permissions_spaces + 4 )); then
                    value=$(echo "$next_line" | awk -F ':' '{print $1}' | tr -d ' ')
                    description=$(echo "$next_line" | awk -F ':' '{$1=""; print $0}' | sed 's/^ *//')
                    echo -e "\nKey: $current_key \t Value: $value \t Description: $description"
                    array+=( "{\"resource\":\"$current_key\",\"action\":\"$value\",\"description\":\"$description\"}" )
                fi
            done < <(sed -n "/permissions:/,/^$/p" "$values_file" | tail -n +2)
            break
        fi
    done < "$values_file"
}

# Function to create JSON
create_json() {
    permissions_json="{"
    permissions_json+="\"name\": \"$app_name\","
    permissions_json+="\"description\": \"local permission import\","
    permissions_json+="\"permissions\":["

    for ((i = 0; i < ${#array[@]}; i++)); do
        permissions_json+="${array[i]}"
        if ((i < ${#array[@]} - 1)); then
            permissions_json+=","
        fi
    done

    permissions_json+="]"
    permissions_json+="}"
}

create_permission() {
    local permission_data="$1"
    
    # Extract resource, action, and description from the permission_data
    local resource=$(echo "$permission_data" | jq -r '.resource')
    local action=$(echo "$permission_data" | jq -r '.action')
    local description=$(echo "$permission_data" | jq -r '.description')
    
    local create_permission_json=$(jq -n \
                                  --arg appId "$app_id" \
                                  --arg productName "$product_name" \
                                  --arg resource "$resource" \
                                  --arg action "$action" \
                                  --arg description "$description" \
                                  '{appId: $appId, productName: $productName, resource: $resource, action: $action, description: $description}')
    
    echo -e "\nRequest payload: $create_permission_json" >&2
    
    response=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "apm-principal-token: $apm_principal_token" \
        -d "$create_permission_json" \
        http://onecx-permission-svc/internal/permissions)
    

    # Check if the response contains an error
    if echo "$response" | jq -e 'has("errorCode")' > /dev/null; then
        print_error "Failed to create permission. Response: $response" >&2
        return 1
    else
        # Extract the permission ID from the response
        permission_id=$(echo "$response" | jq -r '.id')
        if [ -n "$permission_id" ] && [ "$permission_id" != "null" ]; then
            print_success "Permission ID: $permission_id" >&2
            echo "$permission_id"
            return 0
        else
            print_error "Failed to extract valid permission ID. Response: $response" >&2
            return 1
        fi
    fi
}

get_role_id() {
    local default_role_id="onecx-admin-default"
    read -p "Role ID (Press Enter to use the default value: $default_role_id): " user_role_id
    
    if [ -z "$user_role_id" ]; then
        print_success "Using default role ID: $default_role_id" >&2
        echo "$default_role_id"
    else
        print_success "Using provided role ID: $user_role_id" >&2
        echo "$user_role_id"
    fi
}

create_assignment() {
    local permission_id="$1"
    local role_id="$2"

    print_success "=> Creating assignment for permission ID: $permission_id" >&2
    print_success "=> Using role ID: $role_id" >&2

    local create_assignment_json=$(jq -n \
                                  --arg roleId "$role_id" \
                                  --arg permissionId "$permission_id" \
                                  '{roleId: $roleId, permissionId: $permissionId}')

    echo -e "\nAssignment request payload: $create_assignment_json" >&2

    assignment_response=$(curl -s -X POST -H "Content-Type: application/json" \
        -H "apm-principal-token: $apm_principal_token" \
        -d "$create_assignment_json" \
        http://onecx-permission-svc/internal/assignments)

    echo -e "\nCreate Assignment Response: $assignment_response" >&2

    # Extract the assignment ID from the response
    assignment_id=$(echo "$assignment_response" | jq -r '.id // empty')
    if [ -n "$assignment_id" ]; then
        print_success "Assignment ID: $assignment_id" >&2
    else
        print_error "Error creating assignment. Response: $assignment_response" >&2
    fi
}

# Main execution
if [ ! -f "$values_file" ] || [ ! -f "$chart_file" ]; then
    print_error "Error: $values_file or $chart_file not found. Execute this script from the product root directory."
    exit 1
fi

print_warning "For a tutorial on how to use this script please refer to the OneCX Onboarding Guide in Confluence"

get_or_save_token
extract_app_id_and_product_name
find_permissions
create_json

# Get role_id once
role_id=$(get_role_id)

# Array to store skipped entries
skipped_entries=()

# Iterate over all permissions
for permission_data in "${array[@]}"; do
    echo -e "\nProcessing permission: $permission_data"
    
    # Create permission
    if permission_id=$(create_permission "$permission_data"); then
        # Create assignment only if permission creation was successful
        create_assignment "$permission_id" "$role_id"
    else
        print_warning "Skipping assignment creation due to permission creation failure."
        # Extract resource and action for the summary
        resource=$(echo "$permission_data" | jq -r '.resource')
        action=$(echo "$permission_data" | jq -r '.action')
        skipped_entries+=("$resource:$action")
    fi
    
    echo -e "\n---"
done

# Print summary of skipped entries
if [ ${#skipped_entries[@]} -gt 0 ]; then
    print_warning "\nSummary of entries for which permissions/assignments were not created:"
    for entry in "${skipped_entries[@]}"; do
        echo "- $entry"
    done
    echo -e "\n${YELLOW}Note: If these entries are already in the database and you didn't change them, you can ignore the errors and warnings for these assignments/permissions.${NC}"
else
    print_success "\nAll permissions and assignments were created successfully."
fi

print_success "Script completed"