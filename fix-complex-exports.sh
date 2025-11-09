#!/bin/bash

# Fix util/dom.js
sed -i '' 's/module\.exports = {$/export default {/' src/util/dom.js

# Fix controls/util.js  
sed -i '' 's/module\.exports = {$/export default {/' src/controls/util.js

# Fix geometries/common.js
sed -i '' 's/module\.exports = {$/export default {/' src/geometries/common.js

# Fix renderers/WebGlCommon.js
sed -i '' 's/module\.exports = {$/export default {/' src/renderers/WebGlCommon.js

# Fix util/convertFov.js
sed -i '' 's/module\.exports = {$/export default {/' src/util/convertFov.js

echo "✓ Fixed complex exports"
