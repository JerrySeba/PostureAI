const canvasElement = document.getElementById('output_canvas');
const canvasCtx = canvasElement.getContext('2d');
const adviceList = document.getElementById('advice-list');
const baselineStatus = document.getElementById('baseline-status');
const checkLabel = document.getElementById('checkLabel');
const alertOverlay = document.getElementById('alert-overlay');

let targetData = JSON.parse(localStorage.getItem('userBaseline')) || null;
let mode = 'check'; 

// Load status from memory
if (targetData) {
    baselineStatus.innerText = "Baseline: Active";
    baselineStatus.className = "text-xs text-emerald-500 italic";
    checkLabel.classList.remove('opacity-50', 'pointer-events-none');
}

// Logic: Personalized Coaching Analysis
function analyzePosture(landmarks) {
    const currentEar = landmarks[7];
    const currentShoulder = landmarks[11];
    const currentOffset = Math.abs(currentEar.x - currentShoulder.x);

    if (mode === 'calibrate') {
        localStorage.setItem('userBaseline', JSON.stringify({ offset: currentOffset }));
        alert("Success! Your perfect posture baseline is saved.");
        location.reload();
        return;
    }

    if (targetData) {
        // Data Science Logic: Deviation Calculation
        // Formula: |x_1 - x_0|
        const deviation = Math.abs(currentOffset - targetData.offset);
        adviceList.innerHTML = '';

        if (deviation > 0.05) {
            const li = document.createElement('li');
            li.innerText = currentOffset > targetData.offset 
                ? "Your head is drifting forward. Tuck your chin back to your baseline." 
                : "You are over-correcting. Relax your head slightly.";
            adviceList.appendChild(li);
            alertOverlay.style.opacity = "1";
        } else {
            const li = document.createElement('li');
            li.innerText = "Excellent consistency with your saved baseline!";
            adviceList.appendChild(li);
            alertOverlay.style.opacity = "0";
        }
    }
}

const pose = new Pose({
    locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
});

pose.setOptions({ modelComplexity: 1, smoothLandmarks: true });

pose.onResults((results) => {
    if (!results.poseLandmarks) return;

    canvasElement.width = results.image.width;
    canvasElement.height = results.image.height;
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);

    // Draw Visual Aids
    window.drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {color: '#00e5ff', lineWidth: 4});
    window.drawLandmarks(canvasCtx, results.poseLandmarks, {color: '#ffffff', radius: 3});

    analyzePosture(results.poseLandmarks);
    canvasCtx.restore();
});

// File Handlers
document.getElementById('uploadBaseline').addEventListener('change', (e) => {
    mode = 'calibrate';
    processFile(e.target.files[0]);
});

document.getElementById('uploadCheck').addEventListener('change', (e) => {
    mode = 'check';
    processFile(e.target.files[0]);
});

function processFile(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (f) => {
        const img = new Image();
        img.onload = () => pose.send({image: img});
        img.src = f.target.result;
    };
    reader.readAsDataURL(file);
}
