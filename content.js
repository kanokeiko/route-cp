
// content.js
// This script runs on the Google Maps page to extract route information.

function extractRouteInfo() {
  // Try to find the container for the directions.
  // Google Maps classes are obfuscated, so we use heuristics.
  
  // Strategy 1: Look for the specific structure of the directions panel.
  // The panel usually contains a list of steps.
  
  const steps = [];
  
  // Attempt to find all time elements which are usually good anchors
  // They often have a specific format like "6:40"
  // We look for elements that might contain the route details.
  
  // Common container for a step in the directions list
  // Note: These classes (e.g., 'ivN21e') might change. 
  // We will try to find elements by their content structure.
  
  const potentialStepContainers = document.querySelectorAll('div[role="group"] > div, .ivN21e, .tUEI8e'); // Generic selectors often used
  
  // If generic selectors fail, try a more broad search
  const allDivs = document.querySelectorAll('div');
  let routeContainer = null;

  // Heuristic: Find a container that has multiple time-like strings
  // This is expensive, so we try to be specific first.
  
  // Let's try to find the main directions list.
  // It often has a role="list" or similar, but not always.
  
  // Let's look for the specific "transit" details which seem to be the request.
  // The user wants: Address, Time, Station Name, Line Name, Destination.
  
  // Let's try to parse the visible text of the currently selected route.
  // The selected route details are usually in a sidebar.
  
  const sidebar = document.querySelector('#qa-pane') || document.querySelector('#pane') || document.body;
  
  // We will look for the "detailed" directions list.
  // This is often in a container with class 'pb5V0c' or similar (changes often).
  
  // Let's try to find the list of steps by looking for the transit icons or times.
  
  const timePattern = /\d{1,2}:\d{2}/;
  
  // Let's try to find all elements that look like a "step" row.
  // A step row usually contains a time and a description.
  
  // We will collect text from the "directions-panel" if we can find it.
  // A good anchor is the "Send to phone" or "Share" buttons which are usually at the top.
  
  // Let's try to just get the text content of the visible route details and parse it.
  // This is often the most robust way if the DOM is complex.
  
  // Find the container that has the route details.
  // It usually has a role="list" and is inside the sidebar.
  const lists = sidebar.querySelectorAll('div[role="list"]');
  let targetList = null;
  
  for (const list of lists) {
    if (list.innerText.match(timePattern)) {
      // This list contains times, likely the route list.
      // We want the one with the most detail.
      if (!targetList || list.innerText.length > targetList.innerText.length) {
        targetList = list;
      }
    }
  }
  
  if (!targetList) {
    // Fallback: Try to find the main content area
    const mainContent = document.querySelector('[role="main"]');
    if (mainContent && mainContent.innerText.match(timePattern)) {
      targetList = mainContent;
    }
  }

  if (!targetList) {
    return "Could not find route details. Please make sure a route is selected and details are visible.";
  }

  // Now we have a target list. Let's try to parse it line by line or block by block.
  // The structure is usually:
  // Time - Location
  // [Walk/Transit Icon] - Duration/Line Name
  
  // We will iterate through the children of the list.
  const lines = [];
  
  // Helper to clean text
  const clean = (text) => text.replace(/\n+/g, ' ').trim();

  // Let's try to extract structured data if possible.
  // We look for specific attributes or classes that denote "time", "location", "transit-line".
  
  // Since we can't know the exact classes, we will dump the structured text.
  // However, the user wants specific fields: Address, Time, Station Name, Line, Destination.
  
  // Let's try to process the text content of the target list to make it readable.
  // We can split by newlines and try to identify parts.
  
  const rawText = targetList.innerText;
  const textLines = rawText.split('\n').map(l => l.trim()).filter(l => l);
  
  // Filter to start after "Add to Calendar" if present
  const calendarIndex = textLines.findIndex(l => l.includes("カレンダーに追加") || l.includes("Add to Calendar") || l.includes("Calendar"));
  let processedLines = textLines;
  
  if (calendarIndex !== -1) {
    processedLines = textLines.slice(calendarIndex + 1);
  }

  // Filter to end before "Tickets and information" if present
  const ticketIndex = processedLines.findIndex(l => l.includes("乗車券などの情報") || l.includes("Tickets and information"));
  if (ticketIndex !== -1) {
    processedLines = processedLines.slice(0, ticketIndex);
  }
  
  // We can try to format this nicely.
  let formattedOutput = "";
  
  // Simple parser:
  // If a line looks like a time (6:40), it's a start of a step.
  // If a line looks like a duration (12 min), it's travel time.
  
  let buffer = [];
  
  for (let i = 0; i < processedLines.length; i++) {
    const line = processedLines[i];
    
    // Check if it's a time (e.g. 6:40, 06:40, 6:40 PM)
    if (line.match(/^\d{1,2}:\d{2}(?:\s?[AP]M)?$/)) {
      // If we have a buffer, dump it
      if (buffer.length > 0) {
        formattedOutput += buffer.join(" ") + "\n";
        buffer = [];
      }
      buffer.push(line); // Start new line with time
    } else {
      // It's content.
      // Filter out common UI noise
      if (line === "Walk" || line === "Train" || line === "Bus" || line.includes("JPY") || line.includes("Arrive")) {
        // Maybe keep transport mode
        buffer.push("[" + line + "]");
      } else if (line.startsWith("ID:")) {
        // Skip IDs
      } else {
        buffer.push(line);
      }
    }
  }
  
  if (buffer.length > 0) {
    formattedOutput += buffer.join(" ") + "\n";
  }
  
  return formattedOutput || "No route details extracted.";
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getRoute") {
    const data = extractRouteInfo();
    sendResponse({ data: data });
  }
});
