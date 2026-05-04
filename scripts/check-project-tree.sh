#!/bin/bash
# Print project tree (requires 'tree' command)
echo "ServiceOps Project Tree"
echo "======================"
if command -v tree &> /dev/null; then
  tree -I 'node_modules|.next|.git|*.js.map' --dirsfirst -L 4
else
  find . -not -path '*/node_modules/*' -not -path '*/.next/*' -not -path '*/.git/*' | head -100
fi
