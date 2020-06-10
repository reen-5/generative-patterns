const view = (() => {
    "use strict";
    const elPlayPause = document.getElementById('playPause'),
        elDownload = document.getElementById('download'),
        elContinuous = document.getElementById('continuous'),
        elPostRender = document.getElementById('postRender'),
        elSeeds = document.getElementById('recentSeeds'),
        elCanvas = document.getElementById('canvas'),

        NO_OP = () => {},
        MAX_SEEDS = 3,

        STATE_INIT = 1,
        STATE_RUNNING = 2,
        STATE_PAUSED = 3,
        STATE_STOPPED = 4,

        viewModel = {};

    let onStartHandler, onResumeHandler, onPauseHandler, onDownloadHandler, onSeedClickHandler;

    elPlayPause.onclick = () => {
        let handler, newState;
        if (viewModel.state === STATE_INIT || viewModel.state === STATE_STOPPED) {
            handler = onStartHandler || NO_OP;
            newState = STATE_RUNNING;

        } else if (viewModel.state === STATE_RUNNING) {
            handler = onPauseHandler || NO_OP;
            newState = STATE_PAUSED;

        } else if (viewModel.state === STATE_PAUSED) {
            handler = onResumeHandler || NO_OP;
            newState = STATE_RUNNING;

        } else {
            console.assert(false, 'Unexpected state: ' + viewModel.state);
        }
        viewModel.state = newState;
        updateFromModel();
        handler();
    };

    elContinuous.onclick = () => {
        viewModel.isContinuous = elContinuous.checked;
    };

    elPostRender.onclick = () => {
        viewModel.isPostRender = elPostRender.checked;
    };

    elSeeds.onclick = e => {
        (onSeedClickHandler || NO_OP)(e.target.innerText);
    };

    elDownload.onclick = () => (onDownloadHandler || NO_OP)();

    function updateFromModel() {
        if (viewModel.state === STATE_RUNNING) {
            elPlayPause.innerText ='Pause';
        } else if (viewModel.state === STATE_PAUSED) {
            elPlayPause.innerText = 'Resume';
        } else {
            elPlayPause.innerText = 'Start';
        }

        elContinuous.checked = viewModel.isContinuous;
        elPostRender.checked = viewModel.isPostRender;
        elSeeds.innerHTML = viewModel.seeds.map(seed => `<li>${seed}</li>`).join('');
        elDownload.disabled = (viewModel.state === STATE_INIT || viewModel.state === STATE_RUNNING);
    }

    const canvas = (() => {
        const ctx = elCanvas.getContext('2d');

        let updateDimensions = true;
        const canvas = {
            clear() {
                ctx.clearRect(0, 0, elCanvas.width, elCanvas.height);
                if (updateDimensions) {
                    ctx.canvas.width = this.width = elCanvas.clientWidth;
                    ctx.canvas.height = this.height = elCanvas.clientHeight;
                    updateDimensions = false;
                }
            },
            drawLine(line, colour) {
                ctx.strokeStyle = colour;
                ctx.beginPath();
                ctx.moveTo(line.p0.x, line.p0.y);
                ctx.lineTo(line.p1.x, line.p1.y);
                ctx.stroke();
            },
            drawRect(line, width, colour, withGradient) {
                const xDelta = width * Math.cos(line.angle),
                    yDelta = width * Math.sin(line.angle);

                if (withGradient) {
                    const gradient = ctx.createLinearGradient(line.p0.x - xDelta, line.p0.y + yDelta, line.p0.x + xDelta, line.p0.y - yDelta);
                    gradient.addColorStop(0, 'rgba(255,255,255,0)');
                    gradient.addColorStop(0.5, colour);
                    gradient.addColorStop(1, 'rgba(255,255,255,0)');
                    ctx.fillStyle = gradient;
                } else {
                    ctx.fillStyle = colour;
                }
                ctx.beginPath();
                ctx.moveTo(line.p0.x - xDelta, line.p0.y + yDelta);
                ctx.lineTo(line.p1.x - xDelta, line.p1.y + yDelta);
                ctx.lineTo(line.p1.x + xDelta, line.p1.y - yDelta);
                ctx.lineTo(line.p0.x + xDelta, line.p0.y - yDelta);
                ctx.fill();
            },
            isVisible(x,y) {
                return x >= 0 && x < this.width && y >= 0 && y < this.height;
            }
        };

        window.onresize = () => updateDimensions = true;

        return canvas;
    })();

    const viewObj = {
        init() {
            viewModel.state = STATE_INIT;
            viewModel.isContinuous = true;
            viewModel.isPostRender = false;
            viewModel.seeds = [];
            updateFromModel();
        },
        onStart(handler) {
            onStartHandler = handler;
        },
        onResume(handler) {
            onResumeHandler = handler;
        },
        onPause(handler) {
            onPauseHandler = handler;
        },
        onDownload(handler) {
            onDownloadHandler = handler;
        },
        onSeedClick(handler) {
            onSeedClickHandler = handler;
        },
        addSeed(newSeed) {
            if (viewModel.seeds.unshift(newSeed) > MAX_SEEDS){
                viewModel.seeds.length = MAX_SEEDS;
            }
            updateFromModel();
        },
        setStopped() {
            viewModel.state = STATE_STOPPED;
            updateFromModel();
        },
        isContinuous() {
            return viewModel.isContinuous;
        },
        isPostRender() {
            return viewModel.isPostRender;
        },
        canvas
    };

    return viewObj;
})();