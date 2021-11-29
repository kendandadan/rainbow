#!/bin/bash

# This script finds `lang.t` translation IDs that are missing in language
# resources. Note, this script currently **does not** support interpolated
# translations such as `lang.t(`my.\${variable}.based.${path}`).
#
# The script can be run with `sh ./scripts/check-translations.sh` or similar
# from the top-level project directory.

### Constants ###

# The function to search for.
FUNCTION="lang.t"

# The directory to search in for function calls.
DIRECTORY="src"

# The glob of resource files.
RESOURCES=./src/languages/*.json

### Execution ###

# First, find all of the instances of the `lang.t` call.
OUT=$(ggrep -oh -r -P "$FUNCTION\\(('|\").*?('|\")\\)" $DIRECTORY)

# Filter those to be unique.
OUT_UNIQ=$(echo "$OUT" | sort -u)

# Now, for each language file, check if it includes every translation.
for FILENAME in $RESOURCES
do
  # We want to pass the list of unique translation IDs as the first parameter
  # to this inline Node script.
  node - "$OUT_UNIQ" <<- EOM
  // Get the filename from shell string interpolation and read it as JSON.
  let filename = '$FILENAME';
  let languageJson = require(filename);

  // Split the translation IDs into lines.
  let linesParsed = process.argv[2].split('\n');

  // This is updated if an error is found.
  let errorFound = false;

  console.log(\`Checking file "\${filename}":\`)

  for (let translationCall of linesParsed) {
    // Extract the key from the \`lang.t\` call.
    let key = translationCall.substring("lang.t('".length, translationCall.length - 2);

    // This represents the rest of the key that we have to check as each
    // period-separated token is validated.
    let remainingKey = key;

    // Start the match at the top-level translation object.
    let match = languageJson.translation;

    while (remainingKey !== "") {
      // Update the \`segment\` and \`remainingKey\` to include the next token
      // and the rest of the ID after that token, respectively.
      let endOfTokenIndex = remainingKey.indexOf('.');
      if (endOfTokenIndex >= 0) {
        segment = remainingKey.substring(0, endOfTokenIndex);
        remainingKey = remainingKey.substring(endOfTokenIndex + 1);
      } else {
        segment = remainingKey;
        remainingKey = '';
      }

      if (match[segment]) {
        // If we have a match, move down the tree. If this succeeds repeatedly,
        // \`remainingKey\` will reach an empty string without any failures
        // and no error will be printed. Also, store the type of the match
        // for the check.
        let matchType = typeof match[segment];
        match = match[segment];

        // If we reached the end and it's not a string, print a warning.
        if (remainingKey === '' && matchType !== 'string') {
          console.log(\`    🔶 Expected a string value for "\${key}" but found type "\${matchType}".\`)
        }
      } else {
        // Otherwise, the key is not present, so the translations file is
        // incomplete.
        console.log(\`    ❌ Missing "\${key}" in file "\${filename}".\`)
        errorFound = true;
        remainingKey = '';
      }
    }
  }

  // If there were no errors, print a success message.
  if (!errorFound) {
    console.log(\`    ✅ No errors found for "\${filename}".\`);
  }

  console.log();
EOM
done

### Template String Checks ###
echo "Note, this script currently **does not** support interpolated translations such as \`lang.t(\`my.\${variable}.based.\${path}\`)."

# Find all instances of `lang.t` used with a template string.
OUT_DYNAMIC=$(ggrep -oh -r -P "$FUNCTION\\(\`.*?\`\\)" $DIRECTORY)
OUT_DYNAMIC_UNIQ=$(echo "$OUT_DYNAMIC" | sort -u)

for DYNAMIC_CALL in $OUT_DYNAMIC_UNIQ
do
echo "    🔶 Manual check required for \"$DYNAMIC_CALL\"."
done

if [$(echo "$OUT_DYNAMIC_UNIQ" | wc -l) == 0 ]
then
echo "    ✅ No template calls found."
fi