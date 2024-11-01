// /**
//  * Arc Browser Bookmark Converter
//  * 
//  * This script converts Arc browser's StorableSidebar.json file into a standard HTML bookmarks file
//  * that can be imported into other browsers like Chrome, Firefox, Safari etc.
//  * 
//  * Usage:
//  * 1. Export your Arc sidebar data by following Arc's export instructions
//  * 2. Save the JSON file as "StorableSidebar.json" in the same directory as this script
//  * 3. Run this script using Node.js: node converter.js
//  * 4. The script will generate a "bookmarks.html" file that you can import into other browsers
//  */

const fs = require('fs');

/**
 * Cleans and normalizes URLs by removing escape characters and extra slashes
 */
function cleanURL(url) {
    return url?.replace(/\\\/\//g, '//')
              .replace(/\\/g, '')
              .trim();
}

/**
 * Helper function to print debug information in a formatted way
 */
function debugLog(message, data) {
    console.log('\n=== ' + message + ' ===');
    console.log(JSON.stringify(data, null, 2));
    console.log('================\n');
}

/**
 * Finds an item in the items array by its ID
 */
function findItemById(items, id) {
    const item = items.find(item => typeof item === 'object' && item.id === id);
    if (!item) {
        console.log(`Could not find item with id: ${id}`);
    }
    return item;
}

/**
 * Processes the contents of a container (a group of bookmarks/folders in Arc)
 * and converts them into a standard bookmark format
 */
function processContainerContent(container, items) {
    console.log(`Processing container: ${container.id}`);
    
    if (!container.childrenIds || !container.childrenIds.length) {
        console.log(`No children in container: ${container.id}`);
        return [];
    }

    const processedItems = [];
    
    for (const childId of container.childrenIds) {
        console.log(`Processing child ID: ${childId}`);
        
        const item = findItemById(items, childId);
        if (!item) continue;

        console.log(`Found item: ${item.id}, type: ${item.data?.list ? 'folder' : item.data?.tab ? 'bookmark' : 'unknown'}`);

        if (item.data?.tab) {
            const url = cleanURL(item.data.tab.savedURL);
            const title = item.data.tab.savedTitle || url;
            processedItems.push({
                type: 'bookmark',
                title,
                url,
                id: item.id
            });
            console.log(`Added bookmark: ${title}`);
        } else if (item.data?.list) {
            const folderItems = item.childrenIds.map(id => {
                const childItem = findItemById(items, id);
                if (childItem?.data?.tab) {
                    const url = cleanURL(childItem.data.tab.savedURL);
                    const title = childItem.data.tab.savedTitle || url;
                    return {
                        type: 'bookmark',
                        title,
                        url,
                        id: childItem.id
                    };
                }
                return null;
            }).filter(Boolean);

            processedItems.push({
                type: 'folder',
                title: item.title || 'Untitled Folder',
                items: folderItems,
                id: item.id
            });
            console.log(`Added folder: ${item.title} with ${folderItems.length} items`);
        }
    }

    return processedItems;
}

/**
 * Processes an Arc space (equivalent to a top-level folder in traditional bookmarks)
 * and converts its contents into standard bookmark format
 */
async function processSpace(space, items) {
    console.log(`\nProcessing space: ${space.id}`);
    
    const processedItems = [];
    
    // Process pinned containers
    for (const containerId of space.containerIDs || []) {
        if (typeof containerId === 'object') {
            // Skip container type identifiers
            continue;
        }
        
        const container = findItemById(items, containerId);
        if (container) {
            const containerItems = processContainerContent(container, items);
            processedItems.push(...containerItems);
        }
    }

    // Process new containers
    if (space.newContainerIDs) {
        for (const container of space.newContainerIDs) {
            if (typeof container === 'object' && !Array.isArray(container)) {
                const containerId = Object.values(container)[0];
                if (typeof containerId === 'string') {
                    const containerItem = findItemById(items, containerId);
                    if (containerItem) {
                        const containerItems = processContainerContent(containerItem, items);
                        processedItems.push(...containerItems);
                    }
                }
            }
        }
    }

    return {
        type: 'folder',
        title: space.title || 'Default Space',
        items: processedItems,
        id: space.id
    };
}

/**
 * Generates the final HTML bookmarks file in the Netscape Bookmark format,
 * which is the standard format supported by most browsers
 */
function generateHTML(bookmarks) {
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>\n`;

    function generateBookmarkHTML(bookmark, depth = 1) {
        const indent = '    '.repeat(depth);
        
        if (bookmark.type === 'folder') {
            let folderHtml = `${indent}<DT><H3>${bookmark.title}</H3>\n`;
            folderHtml += `${indent}<DL><p>\n`;
            
            for (const item of bookmark.items) {
                folderHtml += generateBookmarkHTML(item, depth + 1);
            }
            
            folderHtml += `${indent}</DL><p>\n`;
            return folderHtml;
        } else {
            return `${indent}<DT><A HREF="${bookmark.url}">${bookmark.title}</A>\n`;
        }
    }

    for (const bookmark of bookmarks) {
        html += generateBookmarkHTML(bookmark);
    }

    html += '</DL><p>';
    return html;
}

/**
 * Main conversion function that orchestrates the entire process
 * @param {string} jsonPath - Path to the Arc browser's StorableSidebar.json file
 * @param {string} outputPath - Path where the HTML bookmarks file should be saved
 */
async function convertJsonToBookmarks(jsonPath, outputPath) {
    try {
        console.log('Starting bookmark conversion...');
        
        // Read and parse the JSON file
        const jsonContent = fs.readFileSync(jsonPath, 'utf8');
        const data = JSON.parse(jsonContent);
        
        const sidebarContainer = data.sidebar.containers[1];
        const items = sidebarContainer.items;
        const spaces = sidebarContainer.spaces;

        debugLog('Items array length', items.length);
        debugLog('Spaces array length', spaces.filter(s => typeof s === 'object').length);

        // Process each space
        const bookmarkStructure = [];
        for (const space of spaces) {
            if (typeof space === 'object') {
                const processedSpace = await processSpace(space, items);
                bookmarkStructure.push(processedSpace);
            }
        }

        debugLog('Final bookmark structure', bookmarkStructure);

        // Generate HTML
        const html = generateHTML(bookmarkStructure);
        
        // Write to file
        fs.writeFileSync(outputPath, html, 'utf8');
        console.log(`Bookmarks file has been generated at: ${outputPath}`);
    } catch (error) {
        console.error('Error processing bookmarks:', error);
        throw error;
    }
}

// Define input and output paths
const inputPath = './StorableSidebar.json';
const outputPath = './bookmarks.html';

// Run the converter
convertJsonToBookmarks(inputPath, outputPath)
    .then(() => console.log('Conversion completed successfully'))
    .catch(error => console.error('Conversion failed:', error));