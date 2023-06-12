const video = document.getElementById('video');

Promise.all([
  faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
  faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
  faceapi.nets.faceLandmark68Net.loadFromUri('/models')
]).then(startWebcam);

function startWebcam() {
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then((stream) => {
      video.srcObject = stream;
    })
    .catch((error) => {
      console.error(error);
    });
}

function getLabeledFaceDescriptions() {
  const labels = ['vishnu'];
  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];
      for (let i = 1; i <= 2; i += 1) {
        const img = await faceapi.fetchImage(`./labels/${label}/(${i}).png`);
        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();
        descriptions.push(detections.descriptor);
      }
      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

video.addEventListener('play', async () => {
  const labeledFaceDescriptors = await getLabeledFaceDescriptions();
  const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors);
  let unknownFaceCount = 0;
  let consecutiveUnknownFaceCount = 1;
  const timeThreshold = 5000; // 5 seconds (in milliseconds)
  let actionInProgress = false;

  const canvas = faceapi.createCanvasFromMedia(video);
  document.body.append(canvas);

  const displaySize = { width: video.width, height: video.height };
  faceapi.matchDimensions(canvas, displaySize);

  setInterval(async () => {
    const detections = await faceapi
      .detectAllFaces(video)
      .withFaceLandmarks()
      .withFaceDescriptors();

    const resizedDetections = faceapi.resizeResults(detections, displaySize);

    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);

    const results = resizedDetections.map((d) => {
      return faceMatcher.findBestMatch(d.descriptor);
    });

    const knownFaceCount = results.filter((result) => !result.toString().includes('unknown')).length;

    if (knownFaceCount === 0) {
      unknownFaceCount += 1;
    } else {
      unknownFaceCount = 0;
    }

    if (unknownFaceCount === 5 && !actionInProgress) {
      actionInProgress = true;
      console.log(`Unknown face detected for ${consecutiveUnknownFaceCount} times`);
      ++consecutiveUnknownFaceCount;
      setTimeout(() => {
        actionInProgress = false;
      }, timeThreshold);
    }

    results.forEach((result, i) => {
      const box = resizedDetections[i].detection.box;
      const drawBox = new faceapi.draw.DrawBox(box, {
        label: result.toString(),
      });
      drawBox.draw(canvas);
    });
  }, 100);
});

console.log("I'm done writing");
