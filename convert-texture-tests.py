import re

with open('test/suite/TextureStore.js', 'r') as f:
    lines = f.readlines()

new_lines = []
i = 0
in_test = False
promise_depth = 0

while i < len(lines):
    line = lines[i]
    
    # Check if this is a test with done
    if re.match(r"\s+it\('.*',\s*function\s*\(done\)\s*\{", line):
        # Replace function (done) { with function () { return new Promise((resolve) => {
        indent = len(line) - len(line.lstrip())
        test_match = re.search(r"it\('([^']+)',", line)
        test_name = test_match.group(1) if test_match else ''
        new_lines.append(' ' * indent + f"it('{test_name}', function () {{\n")
        new_lines.append(' ' * indent + "  return new Promise((resolve) => {\n")
        in_test = True
        promise_depth = 0
        i += 1
        continue
    
    #If in a test, replace done(); with resolve();  
    if in_test and 'done();' in line:
        line = line.replace('done();', 'resolve();')
        new_lines.append(line)
        # Next line should be closing braces - add Promise closing
        i += 1
        if i < len(lines):
            next_line = lines[i]
            new_lines.append(next_line)  # Add the });
            if '});' in next_line and i + 1 < len(lines) and '});' in lines[i + 1]:
                i += 1
                new_lines.append(lines[i])  # Add the next });
                # Add Promise closing
                indent = len(lines[i]) - len(lines[i].lstrip())
                new_lines.append(' ' * (indent - 2) + "});\n")
                in_test = False
        continue
    
    new_lines.append(line)
    i += 1

with open('test/suite/TextureStore.js', 'w') as f:
    f.writelines(new_lines)

print("Converted TextureStore.js")
