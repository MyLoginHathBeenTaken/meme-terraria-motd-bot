const https = require('https'); // For HTTPS requests

// Function to report an image using the Nekos API
function reportImage(imageId) {
    fetch(`https://api.nekosapi.com/v3/images/report?id=${imageId}`, {
        method: "POST",
    }).then(res => {
        // Response is empty as it returns a 204
        console.log(`Reporting image: ${imageId} Status: ${res.status}`)
    })

    // Simulate a delay to avoid overwhelming the API (adjust as needed)
    sleep(250)
}

function sleep(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
// Function to read the list of images from JSON (using require)
function readImageList() {
    try {
        const list = require('./list.json'); // Assuming list.json is in the same directory
        return list;
    } catch (error) {
        console.error('Error requiring list.json:', error);
        return []; // Return empty array on error
    }
}

// Main script
function main() {
    const imageList = readImageList();
    console.log(imageList)
    for (const imageId of imageList) {
        reportImage(imageId);
    }
    console.log('Image reporting completed.');
}

main();