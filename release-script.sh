#!/bin/bash
echo "$1"
echo "$2"
export VERSION=$1
export CHANNEL=$2

# Update root package.json version if needed
packageJsonData=$(cat package.json)
topLevelPackageVersion=$(echo "$packageJsonData" | jq -r '.version')
if [[ $topLevelPackageVersion != $1 ]]
then
    npx -p replace-json-property rjp ./package.json version $1
fi

# List of publishable packages in this repository
packages=("nx-plugin" "create-workspace")

for package in "${packages[@]}"; do
    packageJsonDataLib=$(cat $package/package.json)
    libPackageVersion=$(echo "$packageJsonDataLib" | jq -r '.version')
    
    # Update @onecx dependencies to use the new version
    packageJsonDataLib=$(echo "$packageJsonDataLib" | sed -E 's/(@onecx[^"]+?": *?")([^"]+)"/\1^'$1'"/')
    echo $packageJsonDataLib > $package/package.json
    
    # Update package version and run release target if version changed
    if [[ $libPackageVersion != $1 ]]
    then
        npx -p replace-json-property rjp $package/package.json version $1
        npx nx run $package:release
    fi  
done
