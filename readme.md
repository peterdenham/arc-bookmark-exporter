# Arc Browser Bookmark Converter

A Node.js utility that converts Arc browser's sidebar bookmarks (`StorableSidebar.json`) into a standard HTML bookmarks file. This converted file can be imported into other browsers like Chrome, Firefox, Safari, etc.

## Overview

Arc browser stores its bookmarks and sidebar data in a unique JSON format. This tool converts that format into the standard Netscape bookmark format that other browsers can understand, while maintaining your folder structure and organization.

## Features

- Converts Arc browser's sidebar JSON to standard bookmark format
- Preserves folder hierarchy and space organization
- Maintains bookmark titles and URLs
- Cleans up URLs automatically
- Provides detailed debugging logs
- Creates a standard HTML bookmarks file compatible with major browsers

## Prerequisites

- Node.js installed on your system
- Access to Arc browser's sidebar data

## Usage

1. Locate your Arc sidebar data:
   - On macOS, the file is located at:
     ```
     ~/Library/Application Support/Arc/StorableSidebar.json
     ```
   - You can quickly access this by opening Terminal and running:
     ```bash
     cp ~/Library/Application\ Support/Arc/StorableSidebar.json ./
     ```

2. Copy `StorableSidebar.json` to the same directory as this script

3. Run the converter:
   ```bash
   node converter.js
   ```

4. Import the generated `bookmarks.html` file into your preferred browser:
   - Chrome: Menu → Bookmarks → Import Bookmarks and Settings
   - Firefox: Menu → Bookmarks → Manage Bookmarks → Import and Backup → Import Bookmarks from HTML
   - Safari: File → Import From → Bookmarks HTML File

## Output Structure

The converter maintains your Arc browser's organization:
- Spaces are converted to top-level folders
- Folders and subfolders maintain their hierarchy
- Bookmarks retain their original titles and URLs

## Debug Mode

The script includes detailed logging to help troubleshoot any conversion issues. Debug logs show:
- Number of items processed
- Space and container information
- Processing steps and results

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - feel free to use this in your own projects!

## Support

If you encounter any issues:
1. Check that your `StorableSidebar.json` file is properly copied from the Arc application folder
2. Ensure the JSON file is in the same directory as the script
3. Check the debug output for any error messages

### Common Issues

If you can't find the `StorableSidebar.json` file:
1. Make sure Arc browser is installed
2. The `~/Library` folder is hidden by default on macOS. You can access it by:
   - In Finder, press `Cmd + Shift + G`
   - Type `~/Library/Application Support/Arc`
   - Press Enter