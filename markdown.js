// Advanced Canvas Markdown renderer with proper text wrapping and styling
class SimpleMarkdown {
    static parse(text) {
        // Pre-process text for common LLM response issues
        
        // 1. Make sure we're working with string data
        if (!text) return [];
        text = String(text);
        
        // 2. If there are no newlines but there are multiple sentences,
        // add proper paragraph breaks to improve readability
        if (!text.includes('\n') && text.length > 100) {
            // Look for sentence endings followed by a capital letter to add paragraph breaks
            text = text.replace(/([.!?])\s+([A-Z])/g, "$1\n$2");
        }
        
        // 3. Handle common markdown formatting issues in LLM responses
        // Fix numbered lists that don't have proper spacing
        text = text.replace(/(\d+)\.(?=\w)/g, "$1. ");
        
        // 4. Fix common list item formatting
        text = text.replace(/[-*](?=\w)/g, "- ");
        
        // 5. Add paragraph breaks after list items for better rendering
        text = text.replace(/([-*•]\s+.+?)(?=\s*[-*•]|\s*\d+\.)/g, "$1\n");
        
        // 6. Handle URLs specially - prevent long URLs from breaking layout
        text = text.replace(/(https?:\/\/[^\s]+)/g, (match) => {
            if (match.length > 30) {
                // Use shortened display form for very long URLs
                return match.substring(0, 15) + "..." + match.substring(match.length - 10);
            }
            return match;
        });
        
        // 7. Force maximum continuous text length
        if (text.length > 500) {
            // For very long paragraphs, force some line breaks every ~100 characters
            // but try to do it at punctuation points
            text = text.replace(/([.!?,;])\s+(?=[^\n]{100,})/g, "$1\n");
        } // Added missing closing brace
        
        // Parse markdown into structured data for canvas rendering
        const lines = text.split('\n');
        const parsed = [];
        
        // Track if we're in a list to properly handle multi-line list items
        let inList = false;
        let currentListIndent = 0;
        let listItemContent = '';
        
        for (let i = 0; i < lines.length; i++) {
            let line = lines[i].trim();
            if (!line) {
                // Empty line breaks any active list
                if (inList && listItemContent) {
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                    listItemContent = '';
                }
                inList = false;
                continue;
            }
            
            // Check for headers
            if (line.startsWith('# ')) {
                parsed.push({
                    type: 'header',
                    level: 1,
                    text: line.slice(2),
                    style: 'bold'
                });
            } else if (line.startsWith('## ')) {
                parsed.push({
                    type: 'header',
                    level: 2,
                    text: line.slice(3),
                    style: 'bold'
                });
            } else if (line.startsWith('### ')) {
                parsed.push({
                    type: 'header',
                    level: 3,
                    text: line.slice(4),
                    style: 'bold'
                });
            } 
            // Check for list items
            else if (line.match(/^[\-\*]\s+(.+)/)) {
                // If we were already in a list, finish the previous item
                if (inList && listItemContent) {
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                }
                
                // Start a new list item
                const match = line.match(/^[\-\*]\s+(.+)/);
                listItemContent = match[1];
                inList = true;
                
                // Check if next line is part of this list item (continuation)
                if (i < lines.length - 1 && !lines[i+1].match(/^[\-\*\d]/) && lines[i+1].trim()) {
                    // Continue collecting this list item on next iteration
                    continue;
                } else {
                    // Finish this list item now
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                    listItemContent = '';
                }
            } else if (line.match(/^\d+\.\s+(.+)/)) {
                // If we were already in a list, finish the previous item
                if (inList && listItemContent) {
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                }
                
                // Start a new numbered list item
                const match = line.match(/^\d+\.\s+(.+)/);
                listItemContent = match[1];
                inList = true;
                
                // Check if next line is part of this list item (continuation)
                if (i < lines.length - 1 && !lines[i+1].match(/^[\-\*\d]/) && lines[i+1].trim()) {
                    // Continue collecting this list item on next iteration
                    continue;
                } else {
                    // Finish this list item now
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                    listItemContent = '';
                }
            }
            // Check if this is a continuation of a list item
            else if (inList && listItemContent) {
                listItemContent += ' ' + line;
                
                // Check if this is the last line or if next line starts a new element
                if (i === lines.length - 1 || 
                    lines[i+1].match(/^[\-\*\d#]/) || 
                    !lines[i+1].trim()) {
                    // Finish this list item
                    parsed.push({
                        type: 'list-item',
                        text: listItemContent,
                        bullet: '•'
                    });
                    listItemContent = '';
                    inList = false;
                }
            }
            // Regular paragraph
            else {
                parsed.push({
                    type: 'paragraph',
                    text: line
                });
            }
        }
        
        // Handle any remaining list item
        if (inList && listItemContent) {
            parsed.push({
                type: 'list-item',
                text: listItemContent,
                bullet: '•'
            });
        }
        
        return parsed;
    }
    
    // Parse inline markdown within text (bold, italic)
    static parseInlineMarkdown(text) {
        const parts = [];
        let remaining = text;
        let index = 0;
        
        // Enhanced pattern recognition for various markdown syntax
        const patterns = [
            { regex: /\*\*([^*]+?)\*\*/g, style: 'bold' },     // **bold**
            { regex: /__([^_]+?)__/g, style: 'bold' },         // __bold__
            { regex: /\*([^*]+?)\*/g, style: 'italic' },       // *italic*
            { regex: /_([^_]+?)_/g, style: 'italic' },         // _italic_
            { regex: /`([^`]+?)`/g, style: 'code' },           // `code`
            { regex: /~~([^~]+?)~~/g, style: 'strikethrough' } // ~~strikethrough~~
        ];
        
        let lastIndex = 0;
        const matches = [];
        
        // Find all matches and avoid nested matches
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.regex.exec(text)) !== null) {
                // Check if this match is nested in another match
                const isNested = matches.some(existingMatch => 
                    match.index > existingMatch.start && 
                    match.index + match[0].length < existingMatch.end
                );
                
                if (!isNested) {
                    matches.push({
                        start: match.index,
                        end: match.index + match[0].length,
                        text: match[1],
                        style: pattern.style,
                        fullMatch: match[0]
                    });
                }
            }
        });
        
        // Sort matches by position
        matches.sort((a, b) => a.start - b.start);
        
        // Handle overlapping matches by prioritizing the earlier one
        for (let i = 0; i < matches.length - 1; ) {
            const current = matches[i];
            const next = matches[i + 1];
            
            if (current.end > next.start) {
                // They overlap, remove the later one
                matches.splice(i + 1, 1);
            } else {
                i++;
            }
        }
        
        // Build parts array
        lastIndex = 0;
        matches.forEach(match => {
            // Add text before match
            if (match.start > lastIndex) {
                const beforeText = text.slice(lastIndex, match.start);
                if (beforeText) {
                    parts.push({
                        text: beforeText,
                        style: 'normal'
                    });
                }
            }
            
            // Add styled text
            parts.push({
                text: match.text,
                style: match.style
            });
            
            lastIndex = match.end;
        });
        
        // Add remaining text
        if (lastIndex < text.length) {
            const remainingText = text.slice(lastIndex);
            if (remainingText) {
                parts.push({
                    text: remainingText,
                    style: 'normal'
                });
            }
        }
        
        // If no markdown found, return the whole text as normal
        if (parts.length === 0) {
            parts.push({
                text: text,
                style: 'normal'
            });
        }
        
        return parts;
    }
    
    // Render parsed markdown to canvas with proper text wrapping
    static renderToCanvas(ctx, parsedMarkdown, x, y, maxWidth, baseFont, baseFontSize) {
        let currentY = y;
        const originalFillStyle = ctx.fillStyle; // Store original color

        parsedMarkdown.forEach(element => {
            if (element.type === 'header') {
                const headerSize = baseFontSize + (4 - element.level) * 2;
                ctx.font = `bold ${headerSize}px ${baseFont.split(' ').slice(-1)[0]}`;
                const wrappedLines = this.wrapText(ctx, element.text, maxWidth);
                wrappedLines.forEach(line => {
                    // Draw text at the given x (left edge) + centered offset logic if needed
                    // For headers, we want them centered within the maxWidth area
                    const lineWidth = ctx.measureText(line).width;
                    const centeredX = x + (maxWidth / 2) - (lineWidth / 2); // Center line within maxWidth area starting at x
                    ctx.fillText(line, centeredX, currentY); // Use calculated centered X
                    currentY += headerSize + 4;
                });
                // Add extra space after header
                currentY += 6;
            } else if (element.type === 'list-item') {
                // Bullet point is drawn relative to the left edge (x)
                const bulletX = x + 10; // Adjust bullet position relative to x
                // Text starts after bullet and indent
                const textX = x + 30; // Indent text relative to x
                ctx.font = baseFont;
                ctx.fillText('•', bulletX, currentY);

                // Parse inline markdown within the list item
                const inlineParts = this.parseInlineMarkdown(element.text);
                let currentX = textX; // Start text after bullet
                let lineStartX = textX; // Remember start of line for wrapping resets
                const effectiveMaxWidth = maxWidth - 30; // Account for bullet indent (30px)

                inlineParts.forEach(part => {
                    // Set font based on style
                    let font = baseFont;
                    if (part.style === 'bold') {
                        font = `bold ${baseFontSize}px ${baseFont.split(' ').slice(-1)[0]}`;
                    } else if (part.style === 'italic') {
                        font = `italic ${baseFontSize}px ${baseFont.split(' ').slice(-1)[0]}`;
                    } else if (part.style === 'code') {
                        font = `${baseFontSize}px monospace`;
                    }
                    ctx.font = font;

                    const isStrikethrough = part.style === 'strikethrough';

                    // Wrap text for this part, considering remaining space on the line
                    // Calculate available width on the current line
                    const availableWidthOnLine = effectiveMaxWidth - (currentX - lineStartX);
                    const wrappedLines = this.wrapText(ctx, part.text, availableWidthOnLine);

                    wrappedLines.forEach((line, lineIndex) => {
                        let lineX = currentX;
                        let textY = currentY;

                        if (lineIndex > 0 || (lineIndex === 0 && (currentX - lineStartX) + ctx.measureText(line).width > effectiveMaxWidth)) {
                            // Need new line
                            currentY += baseFontSize + 4;
                            textY = currentY;
                            lineStartX = textX; // Reset line start X to text indent
                            currentX = lineStartX; // Reset X for new line
                            lineX = currentX;
                        }

                        // Handle code blocks with background
                        if (part.style === 'code') {
                            const metrics = ctx.measureText(line);
                            const padding = 2;
                            const bgHeight = baseFontSize + padding * 2; // Simplified height
                            ctx.fillStyle = '#f0f0f0'; // Light gray background
                            ctx.fillRect(
                                lineX - padding,
                                textY - baseFontSize + padding, // Adjust Y for baseline
                                metrics.width + padding * 2,
                                bgHeight
                            );
                            ctx.fillStyle = originalFillStyle; // Reset to original text color
                        }

                        // Draw the text - aligned left at lineX
                        ctx.fillText(line, lineX, textY);

                        // Add strikethrough line if needed
                        if (isStrikethrough) {
                            const metrics = ctx.measureText(line);
                            ctx.beginPath();
                            ctx.moveTo(lineX, textY - metrics.actualBoundingBoxDescent / 2);
                            ctx.lineTo(lineX + metrics.width, textY - metrics.actualBoundingBoxDescent / 2);
                            ctx.strokeStyle = ctx.fillStyle;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }

                        // Update current X position for the next part on the same line
                        // Only update if it's the last line (continuation on same line)
                        if (lineIndex === wrappedLines.length - 1) {
                             // This is the last line segment of this part, use its end position
                             currentX = lineX + ctx.measureText(line).width + ctx.measureText(' ').width; // Add approximate space width for next part
                        }
                    });
                });

                currentY += baseFontSize + 4; // Move to next line after list item
            } else if (element.type === 'paragraph') {
                // Parse inline markdown within the paragraph
                const inlineParts = this.parseInlineMarkdown(element.text);
                // Start paragraph text at the left edge (x)
                let currentX = x;
                let lineStartX = x; // Remember start of line for wrapping resets
                const effectiveMaxWidth = maxWidth; // Use full width for paragraphs

                inlineParts.forEach(part => {
                    // Set font based on style
                    let font = baseFont;
                    if (part.style === 'bold') {
                        font = `bold ${baseFontSize}px ${baseFont.split(' ').slice(-1)[0]}`;
                    } else if (part.style === 'italic') {
                        font = `italic ${baseFontSize}px ${baseFont.split(' ').slice(-1)[0]}`;
                    } else if (part.style === 'code') {
                        font = `${baseFontSize}px monospace`;
                    }
                    ctx.font = font;

                    const isStrikethrough = part.style === 'strikethrough';

                    // Wrap text for this part, considering remaining space on the line
                    const availableWidthOnLine = effectiveMaxWidth - (currentX - lineStartX);
                    const wrappedLines = this.wrapText(ctx, part.text, availableWidthOnLine);

                    wrappedLines.forEach((line, lineIndex) => {
                        let lineX = currentX;
                        let textY = currentY;

                        if (lineIndex > 0 || (lineIndex === 0 && (currentX - lineStartX) + ctx.measureText(line).width > effectiveMaxWidth)) {
                            // Need new line
                            currentY += baseFontSize + 4;
                            textY = currentY;
                            lineStartX = x; // Reset line start X to paragraph start
                            currentX = lineStartX; // Reset X for new line
                            lineX = currentX;
                        }

                        // Handle code blocks with background
                        if (part.style === 'code') {
                            const metrics = ctx.measureText(line);
                            const padding = 2;
                            const bgHeight = baseFontSize + padding * 2;
                            ctx.fillStyle = '#f0f0f0';
                            ctx.fillRect(
                                lineX - padding,
                                textY - baseFontSize + padding,
                                metrics.width + padding * 2,
                                bgHeight
                            );
                            ctx.fillStyle = originalFillStyle; // Reset color
                        }

                        // Draw the text - aligned left at lineX
                        ctx.fillText(line, lineX, textY);

                        // Add strikethrough line if needed
                        if (isStrikethrough) {
                            const metrics = ctx.measureText(line);
                            ctx.beginPath();
                            ctx.moveTo(lineX, textY - metrics.actualBoundingBoxDescent / 2);
                            ctx.lineTo(lineX + metrics.width, textY - metrics.actualBoundingBoxDescent / 2);
                            ctx.strokeStyle = ctx.fillStyle;
                            ctx.lineWidth = 1;
                            ctx.stroke();
                        }

                        // Update current X position for the next part on the same line
                        if (lineIndex === wrappedLines.length - 1) {
                             currentX = lineX + ctx.measureText(line).width + ctx.measureText(' ').width; // Add approximate space
                        }
                    });
                });

                currentY += baseFontSize + 4; // Move to next line after paragraph
            }
        });
        
        ctx.fillStyle = originalFillStyle; // Ensure color is reset
        return currentY - y; // Return total height used
    }
    
    // Helper function to wrap text
    static wrapText(ctx, text, maxWidth) {
        if (!text) return [];
        
        // Force line breaks in very long text without spaces to prevent overflows
        if (text.length > 50 && !text.includes(' ') && !text.includes('\n')) {
            // Insert soft breaks for extremely long strings without spaces
            let softWrappedText = '';
            for (let i = 0; i < text.length; i++) {
                softWrappedText += text[i];
                // Add a space every 15 characters in very long strings without spaces
                if (i > 0 && i % 15 === 0) {
                    softWrappedText += ' ';
                }
            }
            text = softWrappedText;
        }
        
        // First handle explicit newlines that might be in the text
        const paragraphs = text.split('\n');
        if (paragraphs.length > 1) {
            // If there are explicit newlines, process each paragraph separately
            const allLines = [];
            paragraphs.forEach(paragraph => {
                if (paragraph.trim()) {
                    const wrappedParagraph = this.wrapText(ctx, paragraph, maxWidth);
                    allLines.push(...wrappedParagraph);
                }
            });
            return allLines;
        }
        
        // Process normal text wrapping
        const words = text.split(' ');
        const lines = [];
        let currentLine = '';
        
        // Set a lower effective maxWidth to ensure there's always some margin
        // This prevents text from extending right to the edge of the node
        const effectiveMaxWidth = maxWidth * 0.98; // 98% of the available width for safer margins
        
        for (const word of words) {
            const testLine = currentLine ? currentLine + ' ' + word : word;
            const testWidth = ctx.measureText(testLine).width;
            
            if (testWidth > effectiveMaxWidth && currentLine) {
                lines.push(currentLine);
                currentLine = word;
            } else {
                currentLine = testLine;
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        // Handle very long words or situations with no spaces
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Ensure line fits within the maximum width
            const lineWidth = ctx.measureText(line).width;
            if (lineWidth > maxWidth) {
                // Check if it's likely code - handle code differently
                const isLikelyCode = line.includes('(') || line.includes('{') || 
                                    line.includes('=') || line.includes(';') || 
                                    line.match(/^[<>\/\[\]\{\}\(\):;]/) ||
                                    line.match(/^[\s]*[a-z0-9_]+\.[a-z0-9_]+/i);
                
                const chars = line.split('');
                let newLines = [];
                let tempLine = '';
                
                // Use different wrapping strategies for code vs. normal text
                if (isLikelyCode) {
                    // For code-like content, try to break at logical points
                    const codeBreakPoints = ['.', '(', ')', '{', '}', ';', ',', '=', ' ', '+', '-', '/', '*'];
                    
                    for (let j = 0; j < chars.length; j++) {
                        const char = chars[j];
                        const testLine = tempLine + char;
                        
                        if (ctx.measureText(testLine).width > maxWidth) {
                            // Try to find a break point in the last 10 characters
                            let breakFound = false;
                            for (let k = tempLine.length - 1; k >= Math.max(0, tempLine.length - 10); k--) {
                                if (codeBreakPoints.includes(tempLine[k])) {
                                    newLines.push(tempLine.substring(0, k + 1));
                                    tempLine = tempLine.substring(k + 1) + char;
                                    breakFound = true;
                                    break;
                                }
                            }
                            
                            // If no good break point, just break at the current position
                            if (!breakFound) {
                                newLines.push(tempLine);
                                tempLine = char;
                            }
                        } else {
                            tempLine += char;
                        }
                    }
                } else {
                    // For normal text, use simple character-level wrapping with hyphens
                    for (const char of chars) {
                        const testLine = tempLine + char;
                        if (ctx.measureText(testLine).width > maxWidth && tempLine) {
                            newLines.push(tempLine + '-');
                            tempLine = char;
                        } else {
                            tempLine += char;
                        }
                    }
                }
                
                if (tempLine) {
                    newLines.push(tempLine);
                }
                
                lines.splice(i, 1, ...newLines);
                i += newLines.length - 1;
            }
        }
        
        return lines;
    }
    
    static stripTags(html) {
        return html.replace(/<[^>]*>?/gm, '');
    }
}
