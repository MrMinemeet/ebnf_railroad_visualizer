#!/bin/sh

# Remove the old version of the closure compiler
rm -f ./closure-compiler.jar

# Fetch the latest version of the closure compiler
latest_version=$(curl -s https://repo1.maven.org/maven2/com/google/javascript/closure-compiler/ | grep -oP '(?<=href=")[^"]*(?=/)' | sort -V | tail -n 1)
# Download and rename the closure compiler
wget https://repo1.maven.org/maven2/com/google/javascript/closure-compiler/$latest_version/closure-compiler-$latest_version.jar -O ./closure-compiler.jar

# Verify the checksum of closure compiler with the checksum file
expected_sha512=$(curl -s https://repo1.maven.org/maven2/com/google/javascript/closure-compiler/$latest_version/closure-compiler-$latest_version.jar.sha512)
computed_sha512=$(sha512sum ./closure-compiler.jar | cut -d ' ' -f 1)

if [ "$computed_sha512" != "$expected_sha512" ]; then
	echo "Checksum verification failed!"
	exit 1
else
	echo "Checksum verification passed!"
fi