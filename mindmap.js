class MindMapNode {
    constructor(text, x, y, parent = null) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.text = text;
        this.description = '';
        this.x = x;
        this.y = y;
        this.parent = parent;
        this.children = [];
        this.level = parent ? parent.level + 1 : 0;
        this.isHovered = false;
        this.isDragging = false;
        this.isSelected = false;
        this.angle = 0;
        
        // Size based on level
        if (this.level === 0) {
            // Main Topic (Level 0) - Largest
            this.minWidth = 160;
            this.minHeight = 60;
            this.padding = 20;
            this.cornerRadius = 25;
            this.fontSize = 20; // Larger font for main topic
        } else if (this.level === 1) {
            // Sub Topics (Level 1) - Medium
            this.minWidth = 130;
            this.minHeight = 50;
            this.padding = 16;
            this.cornerRadius = 20;
            this.fontSize = 16; // Medium font for direct children
        } else {
            // Leaf Nodes (Level 2+) - Smallest
            this.minWidth = 110;
            this.minHeight = 40;
            this.padding = 12;
            this.cornerRadius = 15;
            this.fontSize = 14; // Smaller font for leaf nodes
        }
        
        // Pre-calculate initial size based on text length and level with maximum width constraints
        const sizeMultiplier = this.level === 0 ? 12 : (this.level === 1 ? 10 : 8);
        
        // Set maximum widths to prevent boxes from becoming too wide
        const maxWidths = {
            0: 300, // Main topic max width
            1: 250, // Sub topic max width  
            2: 200  // Leaf node max width
        };
        
        const calculatedWidth = text.length * sizeMultiplier + this.padding * 2;
        const maxWidth = maxWidths[this.level] || maxWidths[2];
        
        // Apply both minimum and maximum constraints
        this.width = Math.max(this.minWidth, Math.min(calculatedWidth, maxWidth));
        this.height = this.minHeight;
        
        // Define colors with very light, pastel tones
        this.mainColors = [
            { bg: '#FFE8E8', text: '#2D2D2D' }, // Root - Very Light Red
            { bg: '#E0F7F5', text: '#2D2D2D' }, // Child 1 - Very Light Teal
            { bg: '#E8F4FA', text: '#2D2D2D' }, // Child 2 - Very Light Blue
            { bg: '#E8F5F0', text: '#2D2D2D' }, // Child 3 - Very Light Green
            { bg: '#FFFBEB', text: '#2D2D2D' }, // Child 4 - Very Light Yellow
            { bg: '#F5F0F8', text: '#2D2D2D' }, // Child 5 - Very Light Purple
            { bg: '#FFF3E8', text: '#2D2D2D' }, // Child 6 - Very Light Orange
            { bg: '#F0E8F8', text: '#2D2D2D' }, // Child 7 - Very Light Violet
            { bg: '#E8F8F0', text: '#2D2D2D' }, // Child 8 - Very Light Emerald
        ];
        
        // Default color is null, will be set based on level and position
        this.color = null;
    }
    
    getColor() {
        // Return if color is already properly assigned
        if (this.color) {
            return this.color;
        }
        
        // Root node (Level 0) - Always red
        if (this.level === 0) {
            this.color = this.mainColors[0];
            return this.color;
        }
        
        // Layer 2 nodes (Level 1) - Direct children of root get unique colors
        if (this.level === 1) {
            // Find index in parent's children array
            const childIndex = this.parent.children.indexOf(this);
            
            // Choose color from palette (skip the first one which is for root)
            // Make sure to wrap around if there are more children than colors
            const colorIndex = 1 + (childIndex % (this.mainColors.length - 1));
            
            this.color = this.mainColors[colorIndex];
            return this.color;
        }
        
        // Layer 3+ nodes (Level 2+) - Always inherit parent's color
        if (this.parent) {
            // Force parent to calculate its color if not done yet
            const parentColor = this.parent.getColor();
            this.color = parentColor;
            return this.color;
        }
        
        // Fallback - shouldn't happen, but just in case
        this.color = this.mainColors[0];
        return this.color;
    }
    
    addChild(text) {
        // Create the child with the provided text (from LLM or default)
        const tempChild = new MindMapNode(text, 0, 0, this);
        
        console.log("Adding child:", text, "to parent:", this.text, "Parent level:", this.level, "Child level:", tempChild.level);
        
        // Calculate child position based on parent level
        if (this.level === 0) {
            // Main Topic's children (Layer 2)
            let childX, childY;
            const safeDistance = 280; // Increased distance for main topic children
            
            // Use fixed positions for the first 4 children around the root
            switch (this.children.length) {
                case 0: // First child - always right
                    childX = this.x + safeDistance;
                    childY = this.y;
                    break;
                case 1: // Second child - always left
                    childX = this.x - safeDistance;
                    childY = this.y;
                    break;
                case 2: // Third child - always top
                    childX = this.x;
                    childY = this.y - safeDistance;
                    break;
                case 3: // Fourth child - always bottom
                    childX = this.x;
                    childY = this.y + safeDistance;
                    break;
                default:
                    // For additional children, use angles between the cardinal directions
                    const angle = ((this.children.length - 4) % 8) * Math.PI / 4;
                    childX = this.x + Math.cos(angle) * safeDistance;
                    childY = this.y + Math.sin(angle) * safeDistance;
            }
            
            // Update child position
            tempChild.x = childX;
            tempChild.y = childY;
            tempChild.angle = Math.atan2(childY - this.y, childX - this.x);
            
        } else if (this.level === 1) {
            // Layer 2 node's children (Layer 3) - Leaf nodes
            const distance = 220; // Distance from layer 2 to layer 3
            const parentAngle = Math.atan2(this.y - this.parent.y, this.x - this.parent.x);
            const childCount = this.children.length;
            
            // Position away from parent with slight offset
            let offsetAngle = 0;
            if (childCount === 0) {
                offsetAngle = 0; // First child straight ahead
            } else {
                // Alternate left and right
                const direction = (childCount % 2 === 0) ? 1 : -1;
                offsetAngle = direction * Math.PI / 6 * Math.ceil(childCount / 2);
            }
            
            const childAngle = parentAngle + offsetAngle;
            const childX = this.x + Math.cos(childAngle) * distance;
            const childY = this.y + Math.sin(childAngle) * distance;
            
            // Update child position
            tempChild.x = childX;
            tempChild.y = childY;
            tempChild.angle = childAngle;
            
        } else {
            // Layer 3+ node's children (deeper leaf nodes)
            const distance = 180; // Shorter distance for deeper levels
            const parentAngle = Math.atan2(this.y - this.parent.y, this.x - this.parent.x);
            const childCount = this.children.length;
            
            // Position away from parent with slight offset
            let offsetAngle = 0;
            if (childCount === 0) {
                offsetAngle = 0; // First child straight ahead
            } else {
                // Alternate left and right with smaller angles
                const direction = (childCount % 2 === 0) ? 1 : -1;
                offsetAngle = direction * Math.PI / 8 * Math.ceil(childCount / 2);
            }
            
            const childAngle = parentAngle + offsetAngle;
            const childX = this.x + Math.cos(childAngle) * distance;
            const childY = this.y + Math.sin(childAngle) * distance;
            
            // Update child position
            tempChild.x = childX;
            tempChild.y = childY;
            tempChild.angle = childAngle;
        }
        
        // Add child to parent's children array first (needed for correct index calculation)
        this.children.push(tempChild);
        
        // Now set the color based on position in children array
        tempChild.color = null; // Reset in case it was set earlier
        tempChild.getColor();
        
        return tempChild;
    }
    
    findBestAngleForNewChild(usedAngles) {
        if (usedAngles.length === 0) {
            return 0; // First child goes to the right (3 o'clock position)
        }
        
        if (usedAngles.length === 1) {
            return Math.PI; // Second child goes to the left (9 o'clock position)
        }
        
        // Normalize angles to 0-2π range
        const normalizedAngles = usedAngles.map(angle => {
            while (angle < 0) angle += 2 * Math.PI;
            while (angle >= 2 * Math.PI) angle -= 2 * Math.PI;
            return angle;
        }).sort((a, b) => a - b);
        
        let bestAngle = 0;
        let maxGap = 0;
        
        // Check gaps between consecutive angles
        for (let i = 0; i < normalizedAngles.length; i++) {
            const currentAngle = normalizedAngles[i];
            const nextAngle = normalizedAngles[(i + 1) % normalizedAngles.length];
            
            let gap;
            if (i === normalizedAngles.length - 1) {
                // Gap between last and first angle (wrapping around)
                gap = (2 * Math.PI - currentAngle) + nextAngle;
            } else {
                gap = nextAngle - currentAngle;
            }
            
            if (gap > maxGap) {
                maxGap = gap;
                // Place new child in the middle of the largest gap
                if (i === normalizedAngles.length - 1) {
                    bestAngle = currentAngle + gap / 2;
                    if (bestAngle >= 2 * Math.PI) bestAngle -= 2 * Math.PI;
                } else {
                    bestAngle = currentAngle + gap / 2;
                }
            }
        }
        
        return bestAngle;
    }
    
    findNonCollidingPosition(startX, startY, preferredDistance) {
        // Get all existing nodes from the mind map
        const allNodes = this.getAllNodesInMap();
        
        // Calculate approximate node sizes (since we don't have ctx here)
        const avgNodeWidth = 150;
        const avgNodeHeight = 50;
        const safeDistance = Math.max(avgNodeWidth, avgNodeHeight) + 40; // Safe buffer
        
        let x = startX;
        let y = startY;
        let attempts = 0;
        const maxAttempts = 16;
        
        while (attempts < maxAttempts) {
            let hasCollision = false;
            
            // Check collision with all existing nodes
            for (const node of allNodes) {
                if (node === this) continue; // Skip parent node
                
                const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
                
                if (distance < safeDistance) {
                    hasCollision = true;
                    break;
                }
            }
            
            if (!hasCollision) {
                return { x, y };
            }
            
            // Try a new position in a spiral pattern
            const spiralAngle = attempts * (2 * Math.PI / 8); // 8 directions
            const spiralRadius = preferredDistance + Math.floor(attempts / 8) * 80; // Increase radius more aggressively
            x = this.x + Math.cos(spiralAngle) * spiralRadius;
            y = this.y + Math.sin(spiralAngle) * spiralRadius;
            
            attempts++;
        }
        
        // If no collision-free position found, return a position far enough away
        const fallbackAngle = Math.random() * 2 * Math.PI;
        const fallbackDistance = preferredDistance + 150; // Much further fallback
        return {
            x: this.x + Math.cos(fallbackAngle) * fallbackDistance,
            y: this.y + Math.sin(fallbackAngle) * fallbackDistance
        };
    }
    
    getAllNodesInMap() {
        // Get reference to all nodes in the mind map
        // We need to traverse up to root and then get all nodes
        let root = this;
        while (root.parent) {
            root = root.parent;
        }
        
        const allNodes = [];
        const collectNodes = (node) => {
            allNodes.push(node);
            node.children.forEach(child => collectNodes(child));
        };
        
        collectNodes(root);
        return allNodes;
    }
    
    repositionChildren() {
        // This method should only be called when explicitly needed (e.g., after deleting a node)
        // Adding new children should NOT trigger this to avoid chaos
        if (this.children.length === 0) return;
        
        const childCount = this.children.length;
        const baseDistance = 180 + this.level * 40;
        
        if (this.level === 0) {
            // Root node: only reposition if we have too many overlapping children
            const angleStep = (2 * Math.PI) / Math.max(childCount, 6);
            
            this.children.forEach((child, index) => {
                const angle = index * angleStep;
                const distance = baseDistance;
                
                child.angle = angle;
                child.x = this.x + Math.cos(angle) * distance;
                child.y = this.y + Math.sin(angle) * distance;
            });
        } else {
            // Non-root nodes: arrange in a fan pattern away from parent
            const parentAngle = Math.atan2(this.y - this.parent.y, this.x - this.parent.x);
            const maxSpreadAngle = Math.PI / 1.5; // 120 degrees max spread
            const spreadAngle = Math.min(maxSpreadAngle, childCount * 0.4);
            
            this.children.forEach((child, index) => {
                let offsetAngle;
                
                if (childCount === 1) {
                    offsetAngle = 0;
                } else {
                    offsetAngle = (index - (childCount - 1) / 2) * (spreadAngle / Math.max(1, childCount - 1));
                }
                
                const childAngle = parentAngle + offsetAngle;
                const distance = baseDistance + (Math.abs(offsetAngle) * 30);
                
                child.angle = childAngle;
                child.x = this.x + Math.cos(childAngle) * distance;
                child.y = this.y + Math.sin(childAngle) * distance;
            });
        }
        
        // Recursively reposition grandchildren only if needed
        this.children.forEach(child => {
            if (child.children.length > 0) {
                child.repositionChildren();
            }
        });
    }
    
    removeChild(child) {
        const index = this.children.indexOf(child);
        if (index > -1) {
            this.children.splice(index, 1);
            this.repositionChildren();
        }
    }
    
    calculateSize(ctx) {
        // Save the original context state
        const originalFillStyle = ctx.fillStyle;
        const originalFont = ctx.font;

        // Set font size based on level
        const titleFontSize = this.fontSize;
        const titleFont = `bold ${titleFontSize}px Segoe UI`;
        const descFontSize = Math.max(12, titleFontSize - 4);
        const descFont = `${descFontSize}px Segoe UI`;

        // Maximum width varies by level - match the constructor constraints
        const maxWidths = {
            0: 300, // Main topic max width
            1: 250, // Sub topic max width
            2: 200  // Leaf node max width
        };
        const maxWidth = maxWidths[this.level] || maxWidths[2];

        // Calculate available text width (subtract padding)
        const availableTextWidth = maxWidth - (this.padding * 2);

        let totalTextHeight = 0;

        // --- Calculate Title Height ---
        if (this.text) {
            ctx.font = titleFont;
            // Use the existing wrapText method for title
            const titleLines = this.wrapText(ctx, this.text, availableTextWidth, titleFont);
            totalTextHeight += titleLines.length * (titleFontSize + 4); // Line height with padding
        }

        // --- Calculate Description Height ---
        if (this.description) {
            ctx.font = descFont;
            const descriptionLines = this.wrapText(ctx, this.description, availableTextWidth, descFont);
            totalTextHeight += descriptionLines.length * (descFontSize + 4);
        }

        // Calculate width with minimum and maximum constraints based on level
        // We still need to calculate the actual width needed based on the widest line
        let contentWidth = 0;
        ctx.font = titleFont; // Measure title lines
        if (this.text) {
            const titleLines = this.wrapText(ctx, this.text, availableTextWidth, titleFont);
            for (const line of titleLines) {
                const lineWidth = ctx.measureText(line).width;
                contentWidth = Math.max(contentWidth, lineWidth);
            }
        }
        ctx.font = descFont; // Measure description lines
        if (this.description) {
            const descriptionLines = this.wrapText(ctx, this.description, availableTextWidth, descFont);
            for (const line of descriptionLines) {
                const lineWidth = ctx.measureText(line).width;
                contentWidth = Math.max(contentWidth, lineWidth);
            }
        }

        const calculatedWidth = contentWidth + this.padding * 2;
        const nodeMaxWidth = maxWidths[this.level] || maxWidths[2];
        this.width = Math.max(this.minWidth, Math.min(calculatedWidth, nodeMaxWidth));

        // Calculate final height
        this.height = Math.max(
            this.minHeight,
            totalTextHeight + this.padding * 2
        );

        // Restore the original context state
        ctx.fillStyle = originalFillStyle;
        ctx.font = originalFont;
    }
    
    wrapText(ctx, text, maxWidth, fontStyle) {
        // Save original font
        const originalFont = ctx.font;
        ctx.font = fontStyle;
        
        // If text is empty, return empty array
        if (!text || text.trim() === '') {
            ctx.font = originalFont;
            return [];
        }
        
        // Split text by newlines first to preserve intentional line breaks
        const paragraphs = text.split('\n');
        const lines = [];
        
        // Process each paragraph
        for (const paragraph of paragraphs) {
            if (!paragraph.trim()) {
                // Empty paragraph, skip but could add empty line if needed
                continue;
            }
            
            // Special handling for list items - including those with just a dash
            if (paragraph.trim().match(/^[\-\*](\s|$)/) || paragraph.trim().match(/^\d+\.(\s|$)/)) {
                // For list items, still apply word wrapping but preserve the list formatting
                const listPrefix = paragraph.trim().match(/^[\-\*](\s|$)/) ? '- ' : paragraph.trim().match(/^\d+\.(\s|$)/)[0];
                const listContent = paragraph.trim().replace(/^[\-\*]\s*|^\d+\.\s*/, '');
                
                if (listContent) {
                    // Wrap the list content
                    const wrappedContent = this.wrapPlainText(ctx, listContent, maxWidth - ctx.measureText(listPrefix).width);
                    lines.push(listPrefix + wrappedContent[0]); // First line with prefix
                    for (let i = 1; i < wrappedContent.length; i++) {
                        lines.push('  ' + wrappedContent[i]); // Subsequent lines indented
                    }
                } else {
                    lines.push(listPrefix.trim()); // Just the prefix if no content
                }
                continue;
            }
            
            // For regular paragraphs, wrap the text
            const wrappedLines = this.wrapPlainText(ctx, paragraph, maxWidth);
            lines.push(...wrappedLines);
        }
        
        // Restore original font
        ctx.font = originalFont;
        return lines;
    }
    
    // Helper method to wrap plain text without special formatting
    wrapPlainText(ctx, text, maxWidth) {
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth > maxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Handle very long words that exceed maxWidth
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i];
            
            if (ctx.measureText(line).width > maxWidth) {
                // Break down the long word character by character
                const chars = line.split('');
                let newLines = [];
                let tempLine = '';
                
                for (const char of chars) {
                    const testLine = tempLine + char;
                    if (ctx.measureText(testLine).width > maxWidth && tempLine) {
                        newLines.push(tempLine + '-');
                        tempLine = char;
                    } else {
                        tempLine += char;
                    }
                }
                
                if (tempLine) {
                    newLines.push(tempLine);
                }
                
                // Replace the original line with wrapped version
                lines.splice(i, 1, ...newLines);
                i += newLines.length - 1; // Skip the newly added lines
            }
        }
        
        return lines;
    }
    
    contains(x, y) {
        // Check if point is within the node rectangle
        const nodeContains = x >= this.x - this.width / 2 && 
                            x <= this.x + this.width / 2 && 
                            y >= this.y - this.height / 2 && 
                            y <= this.y + this.height / 2;
        
        // Also check if point is within the add button area to maintain hover
        const buttonSize = 24;
        const buttonX = this.x + this.width / 2 + 5;
        const buttonY = this.y - buttonSize / 2;
        const buttonDistance = Math.sqrt(
            Math.pow(x - (buttonX + buttonSize / 2), 2) + 
            Math.pow(y - (buttonY + buttonSize / 2), 2)
        );
        const buttonContains = buttonDistance <= buttonSize / 2 + 5; // Add some padding
        
        return nodeContains || buttonContains;
    }
    
    draw(ctx) {
        this.calculateSize(ctx);
        
        // Force color calculation/assignment if not already set
        const color = this.getColor();
        const x = this.x - this.width / 2;
        const y = this.y - this.height / 2;
        
        // Shadow
        if (!this.isDragging) {
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 3;
            ctx.shadowOffsetY = 3;
        }
        
        // Background 
        ctx.fillStyle = this.isHovered || this.isSelected ? 
            this.lightenColor(color.bg, 20) : color.bg;
        this.drawRoundedRect(ctx, x, y, this.width, this.height, this.cornerRadius);
        ctx.fill();
        
        // Border
        if (this.isSelected) {
            ctx.strokeStyle = '#2196F3';
            ctx.lineWidth = 3;
            ctx.stroke();
        } else if (this.isHovered) {
            ctx.strokeStyle = 'rgba(120, 120, 120, 0.5)'; // Dark gray instead of white
            ctx.lineWidth = 2;
            ctx.stroke();
        }
        
        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Render wrapped text
        // Max width should be proportional to node size
        const maxWidth = this.width - this.padding * 2;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'alphabetic'; // Use alphabetic baseline for consistent positioning
        
        // Set font size based on level
        const titleFontSize = this.fontSize;
        const titleFont = `bold ${titleFontSize}px Segoe UI`;
        const descFontSize = Math.max(12, titleFontSize - 4); // Description is slightly smaller
        const descFont = `${descFontSize}px Segoe UI`;
        
        // Get title lines (wrapped)
        ctx.font = titleFont;
        const titleLines = this.wrapText(ctx, this.text, maxWidth, titleFont);
        
        // Get description lines (wrapped)
        let descriptionLines = [];
        if (this.description) {
            ctx.font = descFont;
            descriptionLines = this.wrapText(ctx, this.description, maxWidth, descFont);
        }
        
        // Calculate vertical positioning - properly center text
        const titleHeight = titleLines.length * (titleFontSize + 4);
        const descHeight = descriptionLines.length * (descFontSize + 4);
        const gapBetweenTitleAndDesc = descriptionLines.length > 0 ? 2 : 0;
        const totalTextHeight = titleHeight + descHeight + gapBetweenTitleAndDesc;
        
        // Center the text block vertically within the node
        let currentY = this.y - totalTextHeight / 2 + titleFontSize;
        
        // Draw title lines
        ctx.fillStyle = color.text;
        ctx.font = titleFont;
        titleLines.forEach(line => {
            ctx.fillText(line, this.x, currentY);
            currentY += titleFontSize + 4; // Line height with padding
        });
        
        // Draw description lines centered
        if (descriptionLines.length > 0) {
            ctx.font = descFont;
            // Always use the text color specified in the node's color scheme
            ctx.fillStyle = color.text;
            
            // Add a small gap between title and description
            currentY += 2;
            
            // Draw description lines centered
            descriptionLines.forEach(line => {
                ctx.fillText(line, this.x, currentY);
                currentY += descFontSize + 4; // Line height with padding
            });
        }
        
        // Add button when hovered
        if (this.isHovered && !this.isDragging) {
            this.drawAddButton(ctx);
        }
    }
    
    drawAddButton(ctx) {
        const buttonSize = 24;
        const buttonX = this.x + this.width / 2 + 5; // Reduced distance from 10 to 5
        const buttonY = this.y - buttonSize / 2;
        
        // Button background
        ctx.fillStyle = '#4CAF50';
        ctx.beginPath();
        ctx.arc(buttonX + buttonSize / 2, buttonY + buttonSize / 2, buttonSize / 2, 0, 2 * Math.PI);
        ctx.fill();
        
        // Plus sign
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        const centerX = buttonX + buttonSize / 2;
        const centerY = buttonY + buttonSize / 2;
        const lineLength = 8;
        
        // Horizontal line
        ctx.beginPath();
        ctx.moveTo(centerX - lineLength / 2, centerY);
        ctx.lineTo(centerX + lineLength / 2, centerY);
        ctx.stroke();
        
        // Vertical line
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - lineLength / 2);
        ctx.lineTo(centerX, centerY + lineLength / 2);
        ctx.stroke();
    }
    
    isAddButtonClicked(x, y) {
        if (!this.isHovered) return false;
        
        const buttonSize = 24;
        const buttonX = this.x + this.width / 2 + 5; // Updated to match drawAddButton
        const buttonY = this.y - buttonSize / 2;
        
        const distance = Math.sqrt(
            Math.pow(x - (buttonX + buttonSize / 2), 2) + 
            Math.pow(y - (buttonY + buttonSize / 2), 2)
        );
        
        return distance <= buttonSize / 2;
    }
    
    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
    
    lightenColor(hex, percent) {
        const num = parseInt(hex.replace("#", ""), 16);
        const amt = Math.round(2.55 * percent);
        const R = (num >> 16) + amt;
        const G = (num >> 8 & 0x00FF) + amt;
        const B = (num & 0x0000FF) + amt;
        return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
            (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
            (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
    }
    
    drawConnectionTo(ctx, child) {
        const startX = this.x;
        const startY = this.y;
        const endX = child.x;
        const endY = child.y;
        
        // Calculate control points for curved line
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;
        
        const dx = endX - startX;
        const dy = endY - startY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // Curve the line slightly
        const curvature = 0.2;
        const curveX = midX - dy * curvature;
        const curveY = midY + dx * curvature;
        
        ctx.strokeStyle = 'rgba(100, 100, 100, 0.6)'; // Dark gray instead of white
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        
        ctx.beginPath();
        ctx.moveTo(startX, startY);
        ctx.quadraticCurveTo(curveX, curveY, endX, endY);
        ctx.stroke();
        
        // Draw arrowhead
        const angle = Math.atan2(dy, dx);
        const arrowLength = 15;
        const arrowAngle = Math.PI / 6;
        
        ctx.fillStyle = 'rgba(100, 100, 100, 0.6)'; // Dark gray instead of white
        ctx.beginPath();
        ctx.moveTo(endX, endY);
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle - arrowAngle),
            endY - arrowLength * Math.sin(angle - arrowAngle)
        );
        ctx.lineTo(
            endX - arrowLength * Math.cos(angle + arrowAngle),
            endY - arrowLength * Math.sin(angle + arrowAngle)
        );
        ctx.closePath();
        ctx.fill();
    }
}

class MindMap {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.selectedNode = null;
        this.hoveredNode = null;
        this.isDragging = false;
        this.dragOffset = { x: 0, y: 0 };
        this.viewOffset = { x: 0, y: 0 };
        this.scale = 1;
        this.isPanning = false;
        this.lastPanPoint = { x: 0, y: 0 };
        
        this.setupCanvas();
        this.setupEventListeners();
        this.createInitialNode();
        this.animate();
    }
    
    setupCanvas() {
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }
    
    resizeCanvas() {
        const container = this.canvas.parentElement;
        this.canvas.width = container.clientWidth * window.devicePixelRatio;
        this.canvas.height = container.clientHeight * window.devicePixelRatio;
        this.canvas.style.width = container.clientWidth + 'px';
        this.canvas.style.height = container.clientHeight + 'px';
        this.ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    
    setupEventListeners() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.handleWheel(e));
        this.canvas.addEventListener('contextmenu', (e) => this.handleContextMenu(e));
        
        // Touch events for mobile
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.handleTouchEnd(e));
        
        // Toolbar events
        document.getElementById('resetZoom').addEventListener('click', () => this.resetZoom());
        document.getElementById('centerView').addEventListener('click', () => this.centerView());
        document.getElementById('exportMap').addEventListener('click', () => this.exportMap());
        document.getElementById('addModel').addEventListener('click', () => this.showModelModal());
        
        // Context menu events
        document.getElementById('addSubtopic').addEventListener('click', () => this.addSubtopic());
        document.getElementById('editTopic').addEventListener('click', () => this.editTopic());
        document.getElementById('deleteTopic').addEventListener('click', () => this.deleteTopic());
        
        // Modal events
        document.getElementById('askQuestion').addEventListener('click', () => this.askQuestion());
        document.getElementById('cancelEdit').addEventListener('click', () => this.closeQuestionModal());
        
        // Model modal events
        document.getElementById('saveModel').addEventListener('click', () => this.saveModelConfiguration());
        document.getElementById('cancelModel').addEventListener('click', () => this.closeModelModal());
        
        // Close modal when clicking outside
        document.getElementById('editModal').addEventListener('click', (e) => {
            if (e.target.id === 'editModal') this.closeQuestionModal();
        });
        
        // Close model modal when clicking outside
        document.getElementById('modelModal').addEventListener('click', (e) => {
            if (e.target.id === 'modelModal') this.closeModelModal();
        });
        
        // Allow pressing Enter in the question input to submit
        document.getElementById('questionInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && e.ctrlKey) {
                e.preventDefault();
                this.askQuestion();
            }
        });
        
        // Allow pressing Enter in the model configuration modal to save
        document.getElementById('modelNameInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.saveModelConfiguration();
            }
        });
        
        // Allow pressing Escape to close modals
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                // Close any open modals
                if (document.getElementById('editModal').style.display === 'block') {
                    this.closeQuestionModal();
                }
                if (document.getElementById('modelModal').style.display === 'block') {
                    this.closeModelModal();
                }
            }
        });
        
        // Hide context menu when clicking elsewhere
        document.addEventListener('click', () => this.hideContextMenu());
    }
    
    createInitialNode() {
        const centerX = this.canvas.width / (2 * window.devicePixelRatio);
        const centerY = this.canvas.height / (2 * window.devicePixelRatio);
        
        // Create root node (Main Topic)
        const rootNode = new MindMapNode('Main Topic', centerX, centerY);
        
        // Explicitly set color for root node
        rootNode.color = rootNode.mainColors[0];
        
        // Root node has larger size, set by the constructor
        // No need to override width/height as it's now handled in the constructor
        
        this.nodes.push(rootNode);
    }
    
    getMousePos(e) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (e.clientX - rect.left - this.viewOffset.x) / this.scale,
            y: (e.clientY - rect.top - this.viewOffset.y) / this.scale
        };
    }
    
    handleMouseDown(e) {
        const pos = this.getMousePos(e);
        const clickedNode = this.getNodeAt(pos.x, pos.y);
        
        if (clickedNode) {
            if (clickedNode.isAddButtonClicked(pos.x, pos.y)) {
                // Set the selected node directly and show question modal
                this.selectedNode = clickedNode;
                this.showQuestionModal();
                return;
            }
            
            this.selectedNode = clickedNode;
            this.isDragging = true;
            this.dragOffset.x = pos.x - clickedNode.x;
            this.dragOffset.y = pos.y - clickedNode.y;
            clickedNode.isDragging = true;
        } else {
            // Start panning
            this.isPanning = true;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
            this.canvas.style.cursor = 'grabbing';
        }
        
        this.hideContextMenu();
    }
    
    handleMouseMove(e) {
        const pos = this.getMousePos(e);
        
        if (this.isDragging && this.selectedNode) {
            // Drag node
            const newX = pos.x - this.dragOffset.x;
            const newY = pos.y - this.dragOffset.y;
            this.moveNodeAndChildren(this.selectedNode, newX, newY);
        } else if (this.isPanning) {
            // Pan view
            const deltaX = e.clientX - this.lastPanPoint.x;
            const deltaY = e.clientY - this.lastPanPoint.y;
            this.viewOffset.x += deltaX;
            this.viewOffset.y += deltaY;
            this.lastPanPoint = { x: e.clientX, y: e.clientY };
        } else {
            // Update hover state
            const hoveredNode = this.getNodeAt(pos.x, pos.y);
            this.updateHoverState(hoveredNode);
        }
    }
    
    handleMouseUp(e) {
        if (this.selectedNode) {
            this.selectedNode.isDragging = false;
        }
        this.isDragging = false;
        this.isPanning = false;
        this.canvas.style.cursor = 'grab';
    }
    
    handleWheel(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        
        const newScale = Math.max(0.1, Math.min(3, this.scale * zoomFactor));
        
        // Zoom towards mouse position
        this.viewOffset.x -= (pos.x * (newScale - this.scale));
        this.viewOffset.y -= (pos.y * (newScale - this.scale));
        
        this.scale = newScale;
    }
    
    handleContextMenu(e) {
        e.preventDefault();
        const pos = this.getMousePos(e);
        const clickedNode = this.getNodeAt(pos.x, pos.y);
        
        if (clickedNode) {
            this.selectedNode = clickedNode;
            this.showContextMenu(e.clientX, e.clientY);
        }
    }
    
    handleTouchStart(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchMove(e) {
        e.preventDefault();
        if (e.touches.length === 1) {
            const touch = e.touches[0];
            this.handleMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
        }
    }
    
    handleTouchEnd(e) {
        e.preventDefault();
        this.handleMouseUp(e);
    }
    
    getNodeAt(x, y) {
        // Check from top to bottom (reverse order for proper hit testing)
        for (let i = this.nodes.length - 1; i >= 0; i--) {
            if (this.nodes[i].contains(x, y)) {
                return this.nodes[i];
            }
        }
        return null;
    }
    
    updateHoverState(hoveredNode) {
        // Clear previous hover state
        this.nodes.forEach(node => node.isHovered = false);
        
        // Set new hover state
        if (hoveredNode) {
            hoveredNode.isHovered = true;
            this.canvas.style.cursor = 'pointer';
        } else {
            this.canvas.style.cursor = 'grab';
        }
        
        this.hoveredNode = hoveredNode;
    }
    
    addChildToNode(parentNode, title, description) {
        // If title is provided, create the node directly
        if (title) {
            const childNode = parentNode.addChild(title);
            
            if (description) {
                childNode.description = description;
            }
            
            this.nodes.push(childNode);
            return childNode;
        }
        
        // No title provided means this function was called directly without LLM results
        // Don't do anything - the question modal is handled separately
        return null;
    }
    
    moveNodeAndChildren(node, newX, newY) {
        const deltaX = newX - node.x;
        const deltaY = newY - node.y;
        
        // Move the node
        node.x = newX;
        node.y = newY;
        
        // Move all children recursively, maintaining their relative positions
        const moveChildren = (parent) => {
            parent.children.forEach(child => {
                child.x += deltaX;
                child.y += deltaY;
                // Update the child's angle relative to its parent
                child.angle = Math.atan2(child.y - parent.y, child.x - parent.x);
                moveChildren(child);
            });
        };
        
        moveChildren(node);
        
        // If this node has a parent, update its angle relative to the parent
        if (node.parent) {
            node.angle = Math.atan2(node.y - node.parent.y, node.x - node.parent.x);
        }
    }
    
    showContextMenu(x, y) {
        const contextMenu = document.getElementById('contextMenu');
        contextMenu.style.display = 'block';
        contextMenu.style.left = x + 'px';
        contextMenu.style.top = y + 'px';
    }
    
    hideContextMenu() {
        document.getElementById('contextMenu').style.display = 'none';
    }
    
    addSubtopic() {
        if (this.selectedNode) {
            this.showQuestionModal();
        }
        this.hideContextMenu();
    }
    
    editTopic() {
        if (this.selectedNode) {
            // For editing, fill the modal with existing title for editing
            document.getElementById('questionInput').value = this.selectedNode.text;
            
            // Set a flag to indicate we're editing rather than adding
            this.isEditing = true;
            
            // Update modal title to indicate editing mode
            document.getElementById('modalTitle').textContent = 'Edit Topic';
            
            // Hide the context box as it's not needed for editing
            document.getElementById('contextBox').style.display = 'none';
            
            // Show the modal
            document.getElementById('editModal').style.display = 'block';
            document.getElementById('questionInput').focus();
        }
        this.hideContextMenu();
    }
    
    deleteTopic() {
        if (this.selectedNode && this.selectedNode.parent) {
            // Check if this is the main topic - prevent deletion of main (root) topic
            if (this.selectedNode.level === 0) {
                console.log("Cannot delete the main topic");
                // Optionally, show a notification to the user that main topic can't be deleted
                return;
            }
            
            // Remove from parent's children
            this.selectedNode.parent.removeChild(this.selectedNode);
            
            // Remove node and all its children from nodes array
            const removeNodeAndChildren = (node) => {
                const index = this.nodes.indexOf(node);
                if (index > -1) {
                    this.nodes.splice(index, 1);
                }
                node.children.forEach(child => removeNodeAndChildren(child));
            };
            
            removeNodeAndChildren(this.selectedNode);
            this.selectedNode = null;
        }
        this.hideContextMenu();
    }
    
    // Helper method to build context from entire branch (root to current node)
    buildBranchContext(node) {
        const branch = [];
        let currentNode = node;
        
        // Traverse up to root node, collecting all nodes in the branch
        while (currentNode) {
            branch.unshift({
                text: currentNode.text,
                description: currentNode.description || "",
                level: currentNode.level
            });
            currentNode = currentNode.parent;
        }
        
        console.log("Building branch context for", node.text, "- Found", branch.length, "levels:", branch);
        
        // Build context string from the entire branch
        const contextParts = branch.map((nodeInfo, index) => {
            const level = index === 0 ? "Main Topic" : `Level ${index}`;
            let contextStr = `${level}: ${nodeInfo.text}`;
            if (nodeInfo.description && nodeInfo.description.trim()) {
                contextStr += `\n  ↳ Details: ${nodeInfo.description}`;
            }
            return contextStr;
        });
        
        const result = contextParts.join('\n\n');
        console.log("Full branch context result:", result);
        return result;
    }

    showQuestionModal() {
        // Reset modal state
        document.getElementById('questionInput').value = "";
        
        // Reset the isEditing flag to false since we're asking a question
        this.isEditing = false;
        
        // Reset loading state
        document.getElementById('loadingStatus').style.display = 'none';
        document.getElementById('askQuestion').disabled = false;
        document.getElementById('loadingText').textContent = 'Generating answer...';
        
        // Clear any error messages from previous attempts
        const modalContent = document.getElementById('editModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Update modal title to indicate question mode
        document.getElementById('modalTitle').textContent = 'Ask a Question';
        
        // Show context information if we're adding a subtopic
        if (this.selectedNode) {
            // Update the context header to show we're adding to this node
            document.getElementById('contextParentTitle').textContent = this.selectedNode.text;
            
            console.log("ShowQuestionModal - Building context for:", this.selectedNode.text, "Level:", this.selectedNode.level);
            
            // Build and format the full branch context for display
            const fullBranchContext = this.buildBranchContext(this.selectedNode);
            
            console.log("ShowQuestionModal - Full branch context:", fullBranchContext);
            
            // Format the context nicely for UI display with proper styling
            const formattedContext = `<strong>Tree Context:</strong><br><br>${fullBranchContext.replace(/\n/g, '<br>')}`;
            
            // Set the formatted context in the details section (the div that gets toggled)
            document.getElementById('contextDetails').innerHTML = formattedContext;
            
            console.log("ShowQuestionModal - Formatted context set in DOM");
            
            // Show the context box
            document.getElementById('contextBox').style.display = 'block';
            
            // Reset the toggle button text and hide details by default
            document.getElementById('toggleContext').textContent = 'Show Tree Context';
            document.getElementById('contextDetails').style.display = 'none';
        } else {
            // Hide context box if no node selected (shouldn't happen)
            document.getElementById('contextBox').style.display = 'none';
        }
        
        // Show the modal
        document.getElementById('editModal').style.display = 'block';
        document.getElementById('questionInput').focus();
        
        // Add event listener for toggle button
        document.getElementById('toggleContext').onclick = () => {
            const detailsElement = document.getElementById('contextDetails');
            const toggleButton = document.getElementById('toggleContext');
            
            console.log("Toggle button clicked. Current display:", detailsElement.style.display);
            console.log("Context details innerHTML:", detailsElement.innerHTML);
            
            if (detailsElement.style.display === 'none') {
                detailsElement.style.display = 'block';
                toggleButton.textContent = 'Hide Tree Context';
                console.log("Showing context details");
            } else {
                detailsElement.style.display = 'none';
                toggleButton.textContent = 'Show Tree Context';
                console.log("Hiding context details");
            }
        };
    }
    
    async askQuestion() {
        const question = document.getElementById('questionInput').value.trim();
        
        if (!question || !this.selectedNode) {
            return;
        }
        
        // If we're in editing mode, update the node text and close the modal
        if (this.isEditing) {
            // Update the node text
            this.selectedNode.text = question;
            
            // Close the modal
            this.closeQuestionModal();
            return;
        }
        
        // Show loading state
        document.getElementById('loadingStatus').style.display = 'flex';
        document.getElementById('askQuestion').disabled = true;
        
        // Clear any previous errors
        const modalContent = document.getElementById('editModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Update loading text with different phases
        const loadingText = document.getElementById('loadingText');
        
        try {
            console.log("Sending question to LLM:", question);
            loadingText.textContent = "Connecting to LLM server...";
            
            // Call LLM service to get answer
            setTimeout(() => {
                if (document.getElementById('loadingStatus').style.display !== 'none') {
                    loadingText.textContent = "Thinking about your question...";
                }
            }, 2000);
            
            setTimeout(() => {
                if (document.getElementById('loadingStatus').style.display !== 'none') {
                    loadingText.textContent = "Still processing (this may take up to a minute)...";
                }
            }, 15000);
            
            let answer;
            // Special test mode for debugging
            if (question.toLowerCase() === "test") {
                console.log("Using test mode");
                await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate delay
                answer = { 
                    title: "Test Mode Activated", 
                    description: "This is a test response to verify the UI flow is working correctly."
                };
            } else {
                // Prepare context for subtopic questions
                let context = null;
                
                // Always include context when adding a child node
                // This ensures the LLM knows what the parent topic is about
                console.log("Selected node level:", this.selectedNode.level);
                console.log("Selected node text:", this.selectedNode.text);
                
                if (this.selectedNode.level === 0) {
                    // For root node children, provide the root node as context
                    console.log("Building context for root node child...");
                    context = `Main Topic: ${this.selectedNode.text}`;
                    if (this.selectedNode.description && this.selectedNode.description.trim()) {
                        context += `\n  ↳ Details: ${this.selectedNode.description}`;
                    }
                    console.log("Using root node context:", context);
                } else {
                    // For deeper levels, use the full branch context
                    console.log("Building context for deeper level node...");
                    context = this.buildBranchContext(this.selectedNode);
                    console.log("Using full branch context for subtopic:", context);
                }
                
                // Call the LLM service with the context
                answer = await window.llmService.generateAnswer(question, context);
            }
            console.log("Received answer from service:", answer);
            
            // Create a new node with the answer
            if (answer && answer.title) {
                try {
                    // Add child to the selected node with the answer content
                    this.addChildToNode(this.selectedNode, answer.title, answer.description);
                    
                    // Reset loading state completely and close modal
                    document.getElementById('loadingStatus').style.display = 'none';
                    document.getElementById('askQuestion').disabled = false;
                    document.getElementById('loadingText').textContent = 'Generating answer...';
                    this.closeQuestionModal();
                } catch (err) {
                    console.error("Error adding node:", err);
                    throw err;
                }
            } else {
                console.error("Invalid answer format:", answer);
                throw new Error('Invalid response format');
            }
            
        } catch (error) {
            console.error('Error asking question:', error);
            
            // Show error message to the user
            const errorMessage = document.createElement('div');
            errorMessage.className = 'modal-error';
            
            // More descriptive error message with detailed information
            let errorDetails;
            
            if (error.toString().includes('API error')) {
                errorDetails = error.toString();
            } else if (error.toString().includes('Failed to fetch')) {
                errorDetails = 'Network error: Could not connect to the LLM server. Please check if the server is running and accessible.';
            } else if (error.toString().includes('timed out')) {
                errorDetails = 'Request timed out after 60 seconds. The server might be overloaded or slow to respond.';
            } else {
                errorDetails = `Error: ${error.toString()}. Please check your API configuration or try again.`;
            }
            
            console.error("Detailed error:", error);
            errorMessage.textContent = errorDetails;
            
            // Reset loading state first
            document.getElementById('loadingStatus').style.display = 'none';
            document.getElementById('askQuestion').disabled = false;
            document.getElementById('loadingText').textContent = 'Generating answer...';
            
            // Add error message to the modal
            const modalContent = document.getElementById('editModal').querySelector('.modal-content');
            
            // Remove any existing error message
            const existingError = modalContent.querySelector('.modal-error');
            if (existingError) {
                existingError.remove();
            }
            
            // Insert error message before the buttons
            const buttons = modalContent.querySelector('.modal-buttons');
            modalContent.insertBefore(errorMessage, buttons);
            
            // Hide loading indicator but keep modal open so user can try again
            document.getElementById('loadingStatus').style.display = 'none';
            document.getElementById('askQuestion').disabled = false;
        }
    }
    
    closeQuestionModal() {
        // Hide the modal
        document.getElementById('editModal').style.display = 'none';
        
        // Clear the input
        document.getElementById('questionInput').value = '';
        
        // Reset loading state
        document.getElementById('loadingStatus').style.display = 'none';
        document.getElementById('askQuestion').disabled = false;
        document.getElementById('loadingText').textContent = 'Generating answer...';
        
        // Clear any error messages
        const modalContent = document.getElementById('editModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
    }

    showModelModal() {
        // Load existing configuration, prioritizing user-saved config from localStorage
        let currentConfig = window.llmService.config.llm;
        
        // Check if there's a user-saved configuration in localStorage
        try {
            const userConfigStr = localStorage.getItem('user_llm_config');
            if (userConfigStr) {
                const userConfig = JSON.parse(userConfigStr);
                // Use user config if available, otherwise fall back to current config
                currentConfig = {
                    endpoint: userConfig.endpoint || currentConfig.endpoint,
                    api_key: userConfig.api_key || currentConfig.api_key,
                    model: userConfig.model || currentConfig.model
                };
                console.log('Loading user configuration in modal from localStorage');
            }
        } catch (error) {
            console.warn('Failed to load user configuration from localStorage:', error);
        }
        
        // Pre-fill the form with current values (prioritizing user-saved config)
        document.getElementById('endpointInput').value = currentConfig.endpoint || 'https://generativelanguage.googleapis.com';
        document.getElementById('apiKeyInput').value = currentConfig.api_key || '';
        document.getElementById('modelNameInput').value = currentConfig.model || 'gemini-2.5-flash';
        
        // Reset loading state
        document.getElementById('modelLoadingStatus').style.display = 'none';
        document.getElementById('saveModel').disabled = false;
        
        // Clear any error messages
        const modalContent = document.getElementById('modelModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Show the modal
        document.getElementById('modelModal').style.display = 'block';
        document.getElementById('endpointInput').focus();
    }

    closeModelModal() {
        // Hide the modal
        document.getElementById('modelModal').style.display = 'none';
        
        // Reset loading state
        document.getElementById('modelLoadingStatus').style.display = 'none';
        document.getElementById('saveModel').disabled = false;
        
        // Clear any error messages
        const modalContent = document.getElementById('modelModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
    }

    async saveModelConfiguration() {
        const endpoint = document.getElementById('endpointInput').value.trim();
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const model = document.getElementById('modelNameInput').value.trim();
        
        // Validate inputs
        if (!endpoint) {
            this.showModelError('Please enter an endpoint URL');
            return;
        }
        
        if (!apiKey) {
            this.showModelError('Please enter an API key');
            return;
        }
        
        if (!model) {
            this.showModelError('Please enter a model name');
            return;
        }
        
        // Show loading state
        document.getElementById('modelLoadingStatus').style.display = 'flex';
        document.getElementById('saveModel').disabled = true;
        document.getElementById('modelLoadingText').textContent = 'Saving configuration...';
        
        try {
            // Update the LLM service configuration
            window.llmService.config.llm = {
                ...window.llmService.config.llm,
                endpoint: endpoint,
                api_key: apiKey,
                model: model
            };
            
            // Store the configuration in localStorage for persistence
            const configToStore = {
                endpoint: endpoint,
                api_key: apiKey,
                model: model,
                timestamp: Date.now()
            };
            localStorage.setItem('user_llm_config', JSON.stringify(configToStore));
            
            // Test the configuration by making a simple request
            document.getElementById('modelLoadingText').textContent = 'Testing configuration...';
            
            // Create a simple test to validate the configuration works
            const testQuestion = "Hello";
            const testAnswer = await window.llmService.generateAnswer(testQuestion);
            
            if (testAnswer && testAnswer.title) {
                // Configuration works
                document.getElementById('modelLoadingText').textContent = 'Configuration saved successfully!';
                
                // Close modal after a short delay
                setTimeout(() => {
                    this.closeModelModal();
                }, 1500);
                
                console.log('Model configuration saved and tested successfully');
            } else {
                throw new Error('Configuration test failed - invalid response format');
            }
            
        } catch (error) {
            console.error('Error saving model configuration:', error);
            this.showModelError('Failed to save configuration: ' + error.message);
            
            // Reset loading state
            document.getElementById('modelLoadingStatus').style.display = 'none';
            document.getElementById('saveModel').disabled = false;
        }
    }

    showModelError(message) {
        // Remove any existing error
        const modalContent = document.getElementById('modelModal').querySelector('.modal-content');
        const existingError = modalContent.querySelector('.modal-error');
        if (existingError) {
            existingError.remove();
        }
        
        // Create and add new error message
        const errorElement = document.createElement('div');
        errorElement.className = 'modal-error';
        errorElement.textContent = message;
        
        // Insert before the buttons
        const buttons = modalContent.querySelector('.modal-buttons');
        modalContent.insertBefore(errorElement, buttons);
    }
    
    resetZoom() {
        this.scale = 1;
        this.viewOffset = { x: 0, y: 0 };
    }
    
    centerView() {
        if (this.nodes.length > 0) {
            const rootNode = this.nodes[0];
            const centerX = this.canvas.width / (2 * window.devicePixelRatio);
            const centerY = this.canvas.height / (2 * window.devicePixelRatio);
            
            this.viewOffset.x = centerX - rootNode.x * this.scale;
            this.viewOffset.y = centerY - rootNode.y * this.scale;
        }
    }
    
    exportMap() {
        const link = document.createElement('a');
        link.download = 'mindmap.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
    
    draw() {
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Apply transformations
        this.ctx.save();
        this.ctx.translate(this.viewOffset.x, this.viewOffset.y);
        this.ctx.scale(this.scale, this.scale);
        
        // Draw connections first
        this.nodes.forEach(node => {
            node.children.forEach(child => {
                node.drawConnectionTo(this.ctx, child);
            });
        });
        
        // Draw nodes
        this.nodes.forEach(node => {
            node.draw(this.ctx);
        });
        
        this.ctx.restore();
    }
    
    animate() {
        this.draw();
        requestAnimationFrame(() => this.animate());
    }
}

// Initialize the mind map when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MindMap('mindMapCanvas');
});
