const video = document.getElementById('video')
const canvas = document.getElementById('canvas')
const captureButton = document.querySelector('button')

// Check if getUserMedia is supported
function hasGetUserMedia() {
    return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
}

// Start the webcam stream
function startWebcam() {
    if (hasGetUserMedia()) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then((stream) => {
                video.srcObject = stream
            })
            .catch((error) => {
                console.error(error)
            })
    } else {
        alert('getUserMedia is not supported in your browser')
    }
}

// Capture photo from webcam
function capturePhoto() {
    const videoWidth = video.videoWidth
    const videoHeight = video.videoHeight

    // Set canvas dimensions to match video aspect ratio
    const aspectRatio = videoWidth / videoHeight
    const canvasWidth = video.clientWidth
    const canvasHeight = canvasWidth / aspectRatio
    canvas.width = canvasWidth
    canvas.height = canvasHeight

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvasWidth, canvasHeight)

    // Convert the canvas image to PNG format
    const imageData = canvas.toDataURL('image/png')

    // Send the captured photo to the server
    sendPhotoToServer(imageData)
}

// Send the captured photo to the server using jQuery AJAX
function sendPhotoToServer(imageData) {
    $.ajax({
        type: 'POST',
        url: 'save_photo.php',
        data: { imageData: imageData },
        success: function (response) {
            // Photo saved successfully
            console.log('Photo captured and saved');
            console.log(response)
        },
        error: function (error) {
            console.error(error)
        }
    })
}

// Start the webcam when the page loads
$(document).ready(function () {
    startWebcam()
})
