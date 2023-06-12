<?php
// Retrieve the captured photo data
$imageData = $_POST['imageData'];

// Generate a unique filename for the photo
$filename = 'captured_photo_' . uniqid() . '.png';

// Save the photo to the photos folder
if (!is_dir('photos')) {
  mkdir('photos');
}
file_put_contents('photos/' . $filename, base64_decode(explode(',', $imageData)[1]));

// Send a response back to the JavaScript code
echo 'Photo saved as ' . $filename;
