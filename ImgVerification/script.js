// Function to load face-api.js models
async function loadModels() {
  await Promise.all([
    faceapi.nets.ssdMobilenetv1.loadFromUri('models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('models')
  ]);
}

// Function to fetch image list from a folder
async function fetchImageList(folderPath) {
  const response = await fetch(folderPath)
  const imageFiles = []

  if (response.ok) {
    const htmlText = await response.text()
    const parser = new DOMParser()
    const htmlDocument = parser.parseFromString(htmlText, 'text/html')
    const anchorElements = htmlDocument.getElementsByTagName('a')

    for (const anchorElement of anchorElements) {
      const href = anchorElement.getAttribute('href')

      if (href && href.endsWith('.png')) {
        imageFiles.push(`${href}`)
      }
    }
  }

  return imageFiles
}

// Function to fetch image using face-api.js
async function fetchImage(imagePath) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      const canvas = faceapi.createCanvasFromMedia(img)
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)
      resolve(canvas)
    }
    img.onerror = (error) => reject(error)
    img.src = imagePath
  })
}

// Function to perform face detection and verification
async function performFaceVerification() {
  const sampleFolderPath = './sample-folder'
  const labelsFolderPath = './labels/vishnu'

  const sampleImageFiles = await fetchImageList(sampleFolderPath)

  // Fetch image list from labels folder
  const labelsImageFiles = await fetchImageList(labelsFolderPath)

  // Perform face detection and verification for each image
  const result = {}

  for (const sampleImageFile of sampleImageFiles) {
    const sampleImage = await fetchImage(sampleImageFile)

    const detections = await faceapi
      .detectAllFaces(sampleImage)
      .withFaceLandmarks()
      .withFaceDescriptors()

    let isVerified = false

    for (const labelsImageFile of labelsImageFiles) {
      const labelsImage = await fetchImage(labelsImageFile)

      const labelsDetections = await faceapi
        .detectAllFaces(labelsImage)
        .withFaceLandmarks()
        .withFaceDescriptors()

      const faceMatcher = new faceapi.FaceMatcher(labelsDetections)
      const bestMatch = faceMatcher.findBestMatch(detections[0].descriptor)

      if (bestMatch.distance < 0.63) {
        isVerified = true
        break
      }
    }

    const imageName = sampleImageFile.substring(sampleImageFile.lastIndexOf('/') + 1)
    result[imageName] = { image_name: imageName, verified: isVerified }
  }

  console.log(JSON.stringify(result))

  displayResult(result)
}

// Function to display the result in a table format
function displayResult(result) {
  const table = $('<table class="table table-bordered">')
  const headerRow = $('<tr>')
  const headerCell1 = $('<th>').text('Image Name')
  const headerCell2 = $('<th>').text('Verified')

  headerRow.append(headerCell1, headerCell2)
  table.append(headerRow)

  for (const imageName in result) {
    const row = $('<tr>')
    const cell1 = $('<td>').text(imageName)
    const cell2 = $('<td>').text(result[imageName].verified ? 'Verified' : 'Not Verified')

    row.append(cell1, cell2)
    table.append(row)
  }

  $('#resultContainer').empty().append(table);
}

// Event listener for the start button
document.getElementById('startButton').addEventListener('click', () => {
  loadModels()
    .then(performFaceVerification)
    .catch((error) => console.error(error))
});

