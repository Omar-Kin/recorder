document.addEventListener('DOMContentLoaded', (event) => {
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');
    const pauseBtn = document.getElementById('pauseBtn');
    const resumeBtn = document.getElementById('resumeBtn');
    const micBtn = document.getElementById('micBtn');
    const systemSoundBtn = document.getElementById('systemSoundBtn');
    const micVolume = document.getElementById('micVolume');
    const micVolumeValue = document.getElementById('micVolumeValue');
    const systemSoundVolume = document.getElementById('systemSoundVolume');
    const systemSoundVolumeValue = document.getElementById('systemSoundVolumeValue');
    const resolutionSelect = document.getElementById('resolutionSelect');
    const fpsSelect = document.getElementById('fpsSelect');
    const cameraCheckbox = document.getElementById('cameraCheckbox');

    let mediaRecorder;
    let chunks = [];
    let micEnabled = false;
    let systemSoundEnabled = false;
    let cameraEnabled = false;

    // Load saved state
    const savedState = JSON.parse(localStorage.getItem('appState'));
    if (savedState) {
        micEnabled = savedState.micEnabled;
        systemSoundEnabled = savedState.systemSoundEnabled;
        micVolume.value = savedState.micVolume;
        micVolumeValue.textContent = `${savedState.micVolume}%`;
        systemSoundVolume.value = savedState.systemSoundVolume;
        systemSoundVolumeValue.textContent = `${savedState.systemSoundVolume}%`;
        resolutionSelect.value = savedState.resolution;
        fpsSelect.value = savedState.fps;
        cameraCheckbox.checked = savedState.cameraEnabled;
        micBtn.textContent = micEnabled ? 'Microphone On' : 'Microphone Off';
        systemSoundBtn.textContent = systemSoundEnabled ? 'System Sound On' : 'System Sound Off';
    }

    const saveState = () => {
        const state = {
            micEnabled,
            systemSoundEnabled,
            micVolume: micVolume.value,
            systemSoundVolume: systemSoundVolume.value,
            resolution: resolutionSelect.value,
            fps: fpsSelect.value,
            cameraEnabled: cameraCheckbox.checked
        };
        localStorage.setItem('appState', JSON.stringify(state));
    };

    startBtn.addEventListener('click', async () => {
        try {
            const displayStream = await navigator.mediaDevices.getDisplayMedia({
                video: { mediaSource: 'screen' },
                audio: systemSoundEnabled
            });

            let audioStream;
            if (micEnabled) {
                audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            let cameraStream;
            if (cameraCheckbox.checked) {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: true });
            }

            const tracks = [...displayStream.getVideoTracks()];
            if (systemSoundEnabled) {
                tracks.push(...displayStream.getAudioTracks());
            }
            if (micEnabled && audioStream) {
                tracks.push(...audioStream.getAudioTracks());
            }
            if (cameraStream) {
                tracks.push(...cameraStream.getVideoTracks());
            }

            const stream = new MediaStream(tracks);
            mediaRecorder = new MediaRecorder(stream);

            mediaRecorder.ondataavailable = (e) => {
                chunks.push(e.data);
            };

            mediaRecorder.onstop = (e) => {
                const blob = new Blob(chunks, { 'type': 'video/mp4;' });
                chunks = [];
                const videoURL = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.style.display = 'none';
                a.href = videoURL;
                a.download = 'recording.mp4';
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(videoURL);
            };

            mediaRecorder.start();
            startBtn.disabled = true;
            stopBtn.disabled = false;
            pauseBtn.disabled = false;
        } catch (error) {
            console.error('Error accessing display media.', error);
        }
    });

    stopBtn.addEventListener('click', () => {
        mediaRecorder.stop();
        startBtn.disabled = false;
        stopBtn.disabled = true;
        pauseBtn.disabled = true;
        resumeBtn.disabled = true;
    });

    pauseBtn.addEventListener('click', () => {
        mediaRecorder.pause();
        pauseBtn.disabled = true;
        resumeBtn.disabled = false;
    });

    resumeBtn.addEventListener('click', () => {
        mediaRecorder.resume();
        resumeBtn.disabled = true;
        pauseBtn.disabled = false;
    });

    micBtn.addEventListener('click', () => {
        micEnabled = !micEnabled;
        micBtn.textContent = micEnabled ? 'Microphone On' : 'Microphone Off';
        saveState();
    });

    systemSoundBtn.addEventListener('click', () => {
        systemSoundEnabled = !systemSoundEnabled;
        systemSoundBtn.textContent = systemSoundEnabled ? 'System Sound On' : 'System Sound Off';
        saveState();
    });

    micVolume.addEventListener('input', () => {
        micVolumeValue.textContent = `${micVolume.value}%`;
        saveState();
    });

    systemSoundVolume.addEventListener('input', () => {
        systemSoundVolumeValue.textContent = `${systemSoundVolume.value}%`;
        saveState();
    });

    resolutionSelect.addEventListener('change', () => {
        const resolution = resolutionSelect.value;
        console.log(`Selected resolution: ${resolution}`);
        saveState();
    });

    fpsSelect.addEventListener('change', () => {
        const fps = fpsSelect.value;
        console.log(`Selected FPS: ${fps}`);
        saveState();
    });

    cameraCheckbox.addEventListener('change', () => {
        cameraEnabled = cameraCheckbox.checked;
        console.log(`Camera recording: ${cameraEnabled}`);
        saveState();
    });
});